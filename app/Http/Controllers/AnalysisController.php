<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AnalysisController extends Controller
{
    public function detect(Request $request)
    {
        $request->validate([
            'pair' => 'required|string|max:10',
        ]);

        $pair = $request->pair;

        $yhCode = $this->toYahooCode($pair);

        $h1 = $this->fetchOHLC($yhCode, '1h', 120);
        if (!$h1) {
            return response()->json(['error' => 'No se pudieron obtener datos'], 502);
        }

        $factors = [];
        $score = 0;

        $sweepResult = $this->detectLiquiditySweep($h1);
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

        return response()->json([
            'pair' => $pair,
            'current_price' => $currentPrice,
            'tendency' => $tendency,
            'score' => min($score, 8),
            'factors' => $factors,
            'total_factors' => count($factors),
            'recent_candles' => array_slice($h1, -10),
        ]);
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

    private function detectLiquiditySweep(array $candles): array
    {
        $n = count($candles);
        if ($n < 30) return ['detected' => false, 'detail' => ''];

        $recent = array_slice($candles, -20);
        $lookback = array_slice($candles, -40, 20);

        $highs = array_column($lookback, 'high');
        $lows = array_column($lookback, 'low');

        $recentHigh = max($highs);
        $recentLow = min($lows);
        $recentHighIdx = array_search($recentHigh, $highs);
        $recentLowIdx = array_search($recentLow, $lows);

        $last = end($recent);
        $prev = prev($recent);

        if ($prev && $last) {
            // Sweep above high and reverse down
            if ($last['high'] > $recentHigh && $last['close'] < $prev['close'] && $last['close'] < $recentHigh) {
                return ['detected' => true, 'detail' => 'Barrida de máximo ' . round($recentHigh, 5) . ' → reversión bajista'];
            }
            // Sweep below low and reverse up
            if ($last['low'] < $recentLow && $last['close'] > $prev['close'] && $last['close'] > $recentLow) {
                return ['detected' => true, 'detail' => 'Barrida de mínimo ' . round($recentLow, 5) . ' → reversión alcista'];
            }
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
}
