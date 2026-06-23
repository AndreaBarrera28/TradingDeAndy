<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AnalysisController extends Controller
{
    public function detect(Request $request)
    {
        $request->validate([
            'pair' => 'required|string|max:10',
            'direction' => 'sometimes|in:buy,sell',
        ]);

        $pair = $request->pair;
        $direction = $request->direction ?? 'buy';

        $yhCode = $this->toYahooCode($pair);

        $h1 = $this->fetchOHLC($yhCode, '1h', 120);
        if (!$h1) {
            return response()->json(['error' => 'No se pudieron obtener datos'], 502);
        }

        $factors = [];
        $score = 0;

        $sweepResult = $this->detectLiquiditySweep($h1, $direction);
        if ($sweepResult['detected']) {
            $factors[] = [
                'key' => 'sweep',
                'label' => 'Barrida de Liquidez (1H)',
                'detail' => $sweepResult['detail'],
            ];
            $score++;
        }

        $bosResult = $this->detectBreakOfStructure($h1);
        if ($bosResult['detected']) {
            $factors[] = [
                'key' => 'bos',
                'label' => 'Ruptura de Estructura (1H)',
                'detail' => $bosResult['detail'],
            ];
            $score++;
        }

        $obResult = $this->detectOrderBlock($h1);
        if ($obResult['detected']) {
            $factors[] = [
                'key' => 'orderblock',
                'label' => 'Order Block / Zona de Oferta',
                'detail' => $obResult['detail'],
            ];
            $score++;
        }

        $fvgResult = $this->detectFVG($h1);
        if ($fvgResult['detected']) {
            $factors[] = [
                'key' => 'fvg',
                'label' => 'Desequilibrio / FVG',
                'detail' => $fvgResult['detail'],
            ];
            $score++;
        }

        $snrResult = $this->detectSupportResistance($h1);
        if ($snrResult['detected']) {
            $factors[] = [
                'key' => 'snr',
                'label' => 'Soporte / Resistencia',
                'detail' => $snrResult['detail'],
            ];
            $score++;
        }

        $currentPrice = end($h1)['close'];
        $tendency = $this->detectTendency($h1);

        $riskAnalysis = $this->calculateRiskAnalysis($pair, $currentPrice, $direction, $h1);

        return response()->json([
            'pair' => $pair,
            'current_price' => $currentPrice,
            'tendency' => $tendency,
            'score' => min($score, 8),
            'factors' => $factors,
            'total_factors' => count($factors),
            'recent_candles' => array_slice($h1, -10),
            'risk_analysis' => $riskAnalysis,
            'session' => $this->detectSession(),
        ]);
    }

    public function session()
    {
        return response()->json($this->detectSession());
    }

    private function calculateRiskAnalysis(string $pair, float $currentPrice, string $direction, array $candles): array
    {
        $highs = array_column($candles, 'high');
        $lows = array_column($candles, 'low');
        $closes = array_column($candles, 'close');

        $findClusters = function ($values, $threshold) {
            $clusters = [];
            foreach ($values as $v) {
                $found = false;
                foreach ($clusters as &$cluster) {
                    if (abs($cluster['price'] - $v) / max($v, 0.0001) < $threshold) {
                        $cluster['count']++;
                        $cluster['price'] = ($cluster['price'] + $v) / 2;
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    $clusters[] = ['price' => $v, 'count' => 2];
                }
            }
            return array_filter($clusters, fn ($c) => $c['count'] >= 3);
        };

        $resistanceClusters = $findClusters($highs, 0.002);
        $supportClusters = $findClusters($lows, 0.002);

        usort($resistanceClusters, fn ($a, $b) => abs($a['price'] - $currentPrice) <=> abs($b['price'] - $currentPrice));
        usort($supportClusters, fn ($a, $b) => abs($a['price'] - $currentPrice) <=> abs($b['price'] - $currentPrice));

        $nearestResistance = $resistanceClusters[0] ?? null;
        $nearestSupport = $supportClusters[0] ?? null;

        $suggestedSl = null;
        $suggestedTp = null;
        $slReason = '';
        $tpReason = '';

        if ($direction === 'buy') {
            if ($nearestSupport) {
                $suggestedSl = round(min($nearestSupport['price'], $currentPrice * 0.995), 5);
                $slReason = 'Basado en soporte más cercano';
            } else {
                $suggestedSl = round($currentPrice * 0.995, 5);
                $slReason = 'SL estimado al 0.5% del precio actual';
            }
            if ($nearestResistance) {
                $suggestedTp = round($nearestResistance['price'], 5);
                $tpReason = 'Basado en resistencia más cercana';
            } else {
                $suggestedTp = round($currentPrice * 1.01, 5);
                $tpReason = 'TP estimado al 1% del precio actual';
            }
        } else {
            if ($nearestResistance) {
                $suggestedSl = round(max($nearestResistance['price'], $currentPrice * 1.005), 5);
                $slReason = 'Basado en resistencia más cercana';
            } else {
                $suggestedSl = round($currentPrice * 1.005, 5);
                $slReason = 'SL estimado al 0.5% del precio actual';
            }
            if ($nearestSupport) {
                $suggestedTp = round($nearestSupport['price'], 5);
                $tpReason = 'Basado en soporte más cercano';
            } else {
                $suggestedTp = round($currentPrice * 0.99, 5);
                $tpReason = 'TP estimado al 1% del precio actual';
            }
        }

        $slPips = $this->pipsBetween($currentPrice, $suggestedSl, $pair);
        $tpPips = $this->pipsBetween($currentPrice, $suggestedTp, $pair);

        $user = User::first();
        $accountBalance = $user ? (float) $user->account_balance : 0;
        $riskPercentage = $user ? (float) $user->risk_percentage : 1.0;

        $maxRiskAmount = $accountBalance * ($riskPercentage / 100);
        $pipValue = $this->estimatePipValue($pair, $currentPrice);
        $suggestedLotSize = $slPips > 0 ? round($maxRiskAmount / ($slPips * $pipValue), 2) : 0.01;
        if ($suggestedLotSize < 0.01) $suggestedLotSize = 0.01;

        $rrRatio = $slPips > 0 ? round($tpPips / $slPips, 2) : 0;

        if ($rrRatio >= 2.0) $verdict = 'excelente';
        elseif ($rrRatio >= 1.5) $verdict = 'buena';
        elseif ($rrRatio >= 1.0) $verdict = 'regular';
        else $verdict = 'mala';

        $maxRiskAmountDisplay = $accountBalance > 0
            ? round($maxRiskAmount, 2)
            : null;

        return [
            'suggested_sl' => $suggestedSl,
            'suggested_tp' => $suggestedTp,
            'sl_pips' => round($slPips, 1),
            'tp_pips' => round($tpPips, 1),
            'sl_reason' => $slReason,
            'tp_reason' => $tpReason,
            'rr_ratio' => $rrRatio,
            'suggested_lot_size' => $suggestedLotSize,
            'account_balance' => $accountBalance > 0 ? $accountBalance : null,
            'risk_percentage' => $riskPercentage,
            'max_risk_amount' => $maxRiskAmountDisplay,
            'verdict' => $verdict,
            'verdict_label' => $this->verdictLabel($verdict),
        ];
    }

    private function verdictLabel(string $verdict): array
    {
        $labels = [
            'excelente' => ['label' => 'EXCELENTE', 'color' => 'text-emerald-400', 'bg' => 'bg-emerald-900/30', 'msg' => 'RR muy favorable. Entrada con buena relación riesgo/beneficio.'],
            'buena' => ['label' => 'BUENA', 'color' => 'text-blue-400', 'bg' => 'bg-blue-900/30', 'msg' => 'RR aceptable. Puedes considerar la entrada con gestión de riesgo adecuada.'],
            'regular' => ['label' => 'REGULAR', 'color' => 'text-yellow-400', 'bg' => 'bg-yellow-900/30', 'msg' => 'RR 1:1 o inferior. Evalúa si realmente vale la pena el riesgo.'],
            'mala' => ['label' => 'MALA', 'color' => 'text-red-400', 'bg' => 'bg-red-900/30', 'msg' => 'RR desfavorable. Mejor esperar una mejor entrada.'],
        ];
        return $labels[$verdict] ?? $labels['mala'];
    }

    private function pipsBetween(float $price1, float $price2, string $pair): float
    {
        $diff = abs($price1 - $price2);
        if (in_array($pair, ['XAUUSD', 'XAGUSD'])) {
            return $diff / 0.01;
        }
        if (in_array($pair, ['USDJPY', 'EURJPY'])) {
            return $diff / 0.01;
        }
        return $diff / 0.0001;
    }

    private function estimatePipValue(string $pair, float $currentPrice): float
    {
        $values = [
            'EURUSD' => 10.0,
            'GBPUSD' => 10.0,
            'AUDUSD' => 10.0,
            'NZDUSD' => 10.0,
            'XAUUSD' => 10.0,
            'XAGUSD' => 10.0,
            'USDJPY' => 9.5,
            'USDCAD' => 7.5,
            'EURJPY' => 7.0,
        ];
        return $values[$pair] ?? 10.0;
    }

    private function toYahooCode(string $pair): string
    {
        $map = [
            'EURUSD' => 'EURUSD=X',
            'GBPUSD' => 'GBPUSD=X',
            'USDJPY' => 'USDJPY=X',
            'EURJPY' => 'EURJPY=X',
            'AUDUSD' => 'AUDUSD=X',
            'USDCAD' => 'USDCAD=X',
            'NZDUSD' => 'NZDUSD=X',
            'XAUUSD' => 'GC=F',
            'XAGUSD' => 'SI=F',
        ];
        return $map[$pair] ?? $pair;
    }

    private function fetchOHLC(string $code, string $interval, int $range): ?array
    {
        try {
            $url = "https://query1.finance.yahoo.com/v8/finance/chart/{$code}?interval={$interval}&range={$range}h";
            $response = Http::timeout(10)->withHeaders([
                'User-Agent' => 'Mozilla/5.0',
            ])->get($url);

            $data = $response->json();
            $result = $data['chart']['result'][0] ?? null;
            if (!$result) return null;

            $timestamps = $result['timestamp'] ?? [];
            $quote = $result['indicators']['quote'][0] ?? [];
            $opens = $quote['open'] ?? [];
            $highs = $quote['high'] ?? [];
            $lows = $quote['low'] ?? [];
            $closes = $quote['close'] ?? [];

            $candles = [];
            foreach ($timestamps as $i => $ts) {
                if (!isset($opens[$i]) || $opens[$i] === null) continue;
                $candles[] = [
                    'time' => $ts,
                    'open' => $opens[$i],
                    'high' => $highs[$i],
                    'low' => $lows[$i],
                    'close' => $closes[$i],
                ];
            }
            return $candles;
        } catch (\Exception $e) {
            return null;
        }
    }

    private function detectLiquiditySweep(array $candles, string $direction = 'buy'): array
    {
        $n = count($candles);
        if ($n < 30) return ['detected' => false, 'detail' => ''];

        $lookback = array_slice($candles, -40, 20);
        $recent = array_slice($candles, -20);

        $highs = array_column($lookback, 'high');
        $lows = array_column($lookback, 'low');

        $recentHigh = max($highs);
        $recentLow = min($lows);

        $last = end($recent);
        $prev = prev($recent);

        if (!$prev || !$last) return ['detected' => false, 'detail' => ''];

        $lastHigh = $last['high'];
        $lastLow = $last['low'];
        $lastClose = $last['close'];

        if ($direction === 'sell') {
            if ($lastHigh > $recentHigh && $lastClose < $recentHigh) {
                return ['detected' => true, 'detail' => 'Barrida de máximo ' . round($recentHigh, 5) . ' → posible reversión bajista'];
            }
            if ($lastLow < $recentLow && $lastClose > $recentLow && $lastClose > $prev['close']) {
                return ['detected' => true, 'detail' => 'Barrida de mínimo ' . round($recentLow, 5) . ' → posible giro alcista (esperar confirmación bajista)'];
            }
        }

        if ($direction === 'buy') {
            if ($lastLow < $recentLow && $lastClose > $recentLow) {
                return ['detected' => true, 'detail' => 'Barrida de mínimo ' . round($recentLow, 5) . ' → posible reversión alcista'];
            }
            if ($lastHigh > $recentHigh && $lastClose < $recentHigh && $lastClose < $prev['close']) {
                return ['detected' => true, 'detail' => 'Barrida de máximo ' . round($recentHigh, 5) . ' → posible giro bajista (esperar confirmación alcista)'];
            }
        }

        // Fallback: detectar cualquier barrida sin filtrar por dirección
        if ($lastHigh > $recentHigh && $lastClose < $recentHigh && $lastClose < $prev['close']) {
            return ['detected' => true, 'detail' => 'Barrida de máximo ' . round($recentHigh, 5) . ' → reversión bajista'];
        }
        if ($lastLow < $recentLow && $lastClose > $recentLow && $lastClose > $prev['close']) {
            return ['detected' => true, 'detail' => 'Barrida de mínimo ' . round($recentLow, 5) . ' → reversión alcista'];
        }

        return ['detected' => false, 'detail' => ''];
    }

    private function detectBreakOfStructure(array $candles): array
    {
        $n = count($candles);
        if ($n < 30) return ['detected' => false, 'detail' => ''];

        $recent = array_slice($candles, -15);
        $highs = array_column($recent, 'high');
        $lows = array_column($recent, 'low');

        $last3Highs = array_slice($highs, -3);
        $last3Lows = array_slice($lows, -3);

        // Bullish BOS: each low higher than previous, each high higher than previous
        if ($last3Lows[0] < $last3Lows[1] && $last3Lows[1] < $last3Lows[2]) {
            return ['detected' => true, 'detail' => 'Estructura alcista: mínimos ascendentes'];
        }
        if ($last3Highs[0] < $last3Highs[1] && $last3Highs[1] < $last3Highs[2]) {
            return ['detected' => true, 'detail' => 'Estructura alcista: máximos ascendentes'];
        }

        // Bearish BOS: each high lower than previous, each low lower than previous
        if ($last3Highs[0] > $last3Highs[1] && $last3Highs[1] > $last3Highs[2]) {
            return ['detected' => true, 'detail' => 'Estructura bajista: máximos descendentes'];
        }
        if ($last3Lows[0] > $last3Lows[1] && $last3Lows[1] > $last3Lows[2]) {
            return ['detected' => true, 'detail' => 'Estructura bajista: mínimos descendentes'];
        }

        return ['detected' => false, 'detail' => ''];
    }

    private function detectOrderBlock(array $candles): array
    {
        $n = count($candles);
        if ($n < 10) return ['detected' => false, 'detail' => ''];

        $recent = array_slice($candles, -10);

        for ($i = 1; $i < count($recent) - 1; $i++) {
            $prev = $recent[$i - 1];
            $cur = $recent[$i];
            $next = $recent[$i + 1];

            // Bullish order block: big red candle followed by strong green
            if ($prev['close'] < $prev['open'] && $cur['close'] > $cur['open'] && $next['close'] > $next['open']) {
                if (($cur['close'] - $cur['open']) > abs($prev['close'] - $prev['open']) * 0.5) {
                    return ['detected' => true, 'detail' => 'Order Block alcista detectado en ' . round($cur['open'], 5)];
                }
            }
            // Bearish order block: big green candle followed by strong red
            if ($prev['close'] > $prev['open'] && $cur['close'] < $cur['open'] && $next['close'] < $next['open']) {
                if (abs($cur['close'] - $cur['open']) > ($prev['close'] - $prev['open']) * 0.5) {
                    return ['detected' => true, 'detail' => 'Order Block bajista detectado en ' . round($cur['open'], 5)];
                }
            }
        }

        return ['detected' => false, 'detail' => ''];
    }

    private function detectFVG(array $candles): array
    {
        $n = count($candles);
        if ($n < 5) return ['detected' => false, 'detail' => ''];

        $recent = array_slice($candles, -15);

        for ($i = 0; $i < count($recent) - 2; $i++) {
            $c1 = $recent[$i];
            $c2 = $recent[$i + 1];
            $c3 = $recent[$i + 2];

            // Bullish FVG: gap between c1 low and c3 high
            if ($c1['low'] > $c3['high']) {
                return ['detected' => true, 'detail' => 'FVG alcista: gap de ' . round($c3['high'], 5) . ' a ' . round($c1['low'], 5)];
            }
            // Bearish FVG: gap between c1 high and c3 low
            if ($c1['high'] < $c3['low']) {
                return ['detected' => true, 'detail' => 'FVG bajista: gap de ' . round($c1['high'], 5) . ' a ' . round($c3['low'], 5)];
            }
        }

        return ['detected' => false, 'detail' => ''];
    }

    private function detectSupportResistance(array $candles): array
    {
        $n = count($candles);
        if ($n < 30) return ['detected' => false, 'detail' => ''];

        $highs = array_column($candles, 'high');
        $lows = array_column($candles, 'low');
        $closes = array_column($candles, 'close');

        $currentPrice = end($closes);

        $findClusters = function ($values, $threshold) {
            $clusters = [];
            foreach ($values as $v) {
                $found = false;
                foreach ($clusters as &$cluster) {
                    if (abs($cluster['price'] - $v) / $v < $threshold) {
                        $cluster['count']++;
                        $cluster['price'] = ($cluster['price'] + $v) / 2;
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    $clusters[] = ['price' => $v, 'count' => 2];
                }
            }
            return array_filter($clusters, fn ($c) => $c['count'] >= 3);
        };

        $resistanceClusters = $findClusters($highs, 0.002);
        $supportClusters = $findClusters($lows, 0.002);

        // Find nearest S/R to current price
        $nearest = null;
        foreach (array_merge($resistanceClusters, $supportClusters) as $s) {
            $dist = abs($s['price'] - $currentPrice);
            if ($dist / $currentPrice < 0.01) {
                if (!$nearest || $dist < $nearest['dist']) {
                    $nearest = [
                        'type' => in_array($s, $resistanceClusters) ? 'resistencia' : 'soporte',
                        'price' => $s['price'],
                        'dist' => $dist,
                        'touches' => $s['count'],
                    ];
                }
            }
        }

        if ($nearest) {
            return [
                'detected' => true,
                'detail' => "{$nearest['type']} cerca en " . round($nearest['price'], 5) . " ({$nearest['touches']} toques)",
            ];
        }

        return ['detected' => false, 'detail' => ''];
    }

    private function detectTendency(array $candles): array
    {
        $recent = array_slice($candles, -20);
        $sma5 = array_sum(array_column(array_slice($recent, -5), 'close')) / 5;
        $sma20 = array_sum(array_column($recent, 'close')) / 20;

        $currentPrice = end($recent)['close'];

        if ($sma5 > $sma20 && $currentPrice > $sma5) {
            return ['direction' => 'alcista', 'strength' => 'fuerte'];
        }
        if ($sma5 > $sma20) {
            return ['direction' => 'alcista', 'strength' => 'débil'];
        }
        if ($sma5 < $sma20 && $currentPrice < $sma5) {
            return ['direction' => 'bajista', 'strength' => 'fuerte'];
        }
        if ($sma5 < $sma20) {
            return ['direction' => 'bajista', 'strength' => 'débil'];
        }
        return ['direction' => 'neutral', 'strength' => 'baja'];
    }

    private function detectSession(): array
    {
        $now = new \DateTimeImmutable('now', new \DateTimeZone('America/New_York'));
        $hour = (int) $now->format('G');
        $dayOfWeek = (int) $now->format('N');
        $isWeekend = $dayOfWeek >= 6;

        $isAsian = ($hour >= 19 || $hour < 4);
        $isLondon = ($hour >= 3 && $hour < 12);
        $isNY = ($hour >= 8 && $hour < 17);

        $currentSessions = [];
        if ($isAsian) $currentSessions[] = 'Asiática';
        if ($isLondon) $currentSessions[] = 'Londres';
        if ($isNY) $currentSessions[] = 'Nueva York';

        $nyStatus = 'cerrada';
        $message = '';
        $alert = null;

        if ($isWeekend) {
            $message = '⚠️ Fin de semana. Los mercados están cerrados.';
            $alert = 'warning';
        } elseif ($isNY) {
            $nyStatus = 'activa';
            $hourRemaining = 17 - $hour;
            if ($hour >= 8 && $hour < 9) {
                $message = "🗽 Sesión de Nueva York INICIADA — Bienvenida. Hoy te queda toda la sesión para operar.";
                $alert = 'ny_open';
            } elseif ($hour >= 16) {
                $message = "⚠️ Sesión de Nueva York por CERRAR (1 hora restante). Prepara tu salida.";
                $alert = 'ny_close';
            } else {
                $message = "🗽 Sesión de Nueva York ACTIVA — Buen trading. Te quedan {$hourRemaining} horas de sesión.";
                $alert = 'ny_active';
            }
        } else {
            $message = "⚠️ Ya NO estamos en sesión de Nueva York. Aunque la entrada sea buena, considera esperar a mañana para operar con la sesión NY.";
            $alert = 'no_ny';
        }

        return [
            'current_sessions' => $currentSessions,
            'in_ny_session' => $isNY,
            'is_weekend' => $isWeekend,
            'ny_status' => $nyStatus,
            'hour_et' => $hour,
            'message' => $message,
            'alert' => $alert,
        ];
    }
}
