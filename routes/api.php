<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TradeController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\AnalysisController;

Route::apiResource('trades', TradeController::class)->only(['index', 'store', 'update']);
Route::get('stats', [TradeController::class, 'stats']);
Route::get('prices', [TradeController::class, 'prices']);
Route::get('analyze', [AnalysisController::class, 'detect']);

Route::get('settings', [SettingsController::class, 'show']);
Route::put('settings', [SettingsController::class, 'update']);

Route::get('session', [AnalysisController::class, 'session']);
