<?php

namespace App\Http\Controllers;

use App\Models\Trade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TradeController extends Controller
{
    public function index()
    {
        return Trade::orderBy('date', 'desc')->get()->map(fn ($t) => [
            ...$t->toArray(),
            'confluence_factors' => $t->confluence_factors ?? [],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:open,closed,analyzed',
            'date' => 'required|date',
            'pair' => 'required|string|max:10',
            'direction' => 'required|in:buy,sell',
            'entry_price' => 'required|numeric',
            'exit_price' => 'nullable|numeric',
            'stop_loss' => 'nullable|numeric',
            'take_profit' => 'nullable|numeric',
            'lot_size' => 'required|numeric|min:0.01',
            'result' => 'nullable|in:win,loss,breakeven',
            'pips' => 'nullable|numeric',
            'confluence_score' => 'nullable|integer|min:0|max:10',
            'confluence_factors' => 'nullable|array',
            'confluence_factors.*' => 'string',
            'setup_notes' => 'nullable|string',
            'entry_reason' => 'nullable|string',
            'exit_reason' => 'nullable|string',
            'emotions' => 'nullable|string|max:255',
            'lessons' => 'nullable|string',
        ]);

        $validated['status'] ??= 'analyzed';

        $trade = Trade::create($validated);

        return response()->json($trade, 201);
    }

    public function update(Request $request, Trade $trade)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:open,closed,analyzed',
            'date' => 'sometimes|date',
            'pair' => 'sometimes|string|max:10',
            'direction' => 'sometimes|in:buy,sell',
            'entry_price' => 'sometimes|numeric',
            'exit_price' => 'nullable|numeric',
            'stop_loss' => 'nullable|numeric',
            'take_profit' => 'nullable|numeric',
            'lot_size' => 'sometimes|numeric|min:0.01',
            'result' => 'nullable|in:win,loss,breakeven',
            'pips' => 'nullable|numeric',
            'confluence_score' => 'nullable|integer|min:0|max:10',
            'confluence_factors' => 'nullable|array',
            'confluence_factors.*' => 'string',
            'setup_notes' => 'nullable|string',
            'entry_reason' => 'nullable|string',
            'exit_reason' => 'nullable|string',
            'emotions' => 'nullable|string|max:255',
            'lessons' => 'nullable|string',
        ]);

        $trade->update($validated);

        return response()->json($trade->fresh());
    }

    public function stats()
    {
        $total = Trade::count();
        if ($total === 0) {
            return response()->json([
                'total' => 0, 'analyzed' => 0,
                'wins' => 0, 'losses' => 0, 'breakevens' => 0,
                'win_rate' => 0, 'total_pips' => 0, 'avg_confluence' => 0,
                'high_conf_pct' => 0, 'med_conf_pct' => 0, 'low_conf_pct' => 0,
            ]);
        }

        $closedTotal = Trade::whereIn('status', ['closed', 'analyzed'])->whereNotNull('result')->count();
        $wins = Trade::whereIn('status', ['closed', 'analyzed'])->where('result', 'win')->count();
        $losses = Trade::whereIn('status', ['closed', 'analyzed'])->where('result', 'loss')->count();
        $breakevens = Trade::whereIn('status', ['closed', 'analyzed'])->where('result', 'breakeven')->count();
        $totalPips = Trade::whereIn('status', ['closed', 'analyzed'])->sum('pips') ?? 0;
        $avgConfluence = Trade::whereNotNull('confluence_score')->avg('confluence_score') ?? 0;

        $highConf = Trade::where('confluence_score', '>=', 6)->count();
        $medConf = Trade::where('confluence_score', '>=', 3)->where('confluence_score', '<=', 5)->count();
        $lowConf = Trade::where('confluence_score', '<', 3)->count();

        return response()->json([
            'total' => $total,
            'analyzed' => Trade::where('status', 'analyzed')->count(),
            'wins' => $wins,
            'losses' => $losses,
            'breakevens' => $breakevens,
            'win_rate' => $closedTotal > 0 ? round(($wins / $closedTotal) * 100, 1) : 0,
            'total_pips' => round($totalPips, 1),
            'avg_confluence' => round($avgConfluence, 1),
            'high_conf_pct' => $total > 0 ? round(($highConf / $total) * 100) : 0,
            'med_conf_pct' => $total > 0 ? round(($medConf / $total) * 100) : 0,
            'low_conf_pct' => $total > 0 ? round(($lowConf / $total) * 100) : 0,
        ]);
    }

    public function prices()
    {
        $pairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'EURJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'XAUUSD', 'XAGUSD'];

        $urlCodes = collect($pairs)->map(fn ($p) => substr($p, 0, 3) . '-' . substr($p, 3))->implode(',');

        try {
            $response = Http::timeout(5)->get("https://economia.awesomeapi.com.br/json/last/{$urlCodes}");
            $data = $response->json();

            $result = [];
            foreach ($pairs as $pair) {
                if (isset($data[$pair])) {
                    $result[$pair] = [
                        'bid' => (float) $data[$pair]['bid'],
                        'ask' => (float) $data[$pair]['ask'],
                        'var' => (float) $data[$pair]['pctChange'],
                    ];
                }
            }

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([], 200);
        }
    }
}
