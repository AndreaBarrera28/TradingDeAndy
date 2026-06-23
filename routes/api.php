<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TradeController;

Route::apiResource('trades', TradeController::class)->only(['index', 'store', 'update']);
Route::get('stats', [TradeController::class, 'stats']);
Route::get('prices', [TradeController::class, 'prices']);
Route::get('analyze', [\App\Http\Controllers\AnalysisController::class, 'detect']);
