<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show()
    {
        $user = User::first() ?? User::factory()->create();

        return response()->json([
            'account_balance' => (float) $user->account_balance,
            'risk_percentage' => (float) $user->risk_percentage,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'account_balance' => 'required|numeric|min:0',
            'risk_percentage' => 'required|numeric|min:0.01|max:100',
        ]);

        $user = User::first() ?? User::factory()->create();
        $user->update($validated);

        return response()->json([
            'account_balance' => (float) $user->account_balance,
            'risk_percentage' => (float) $user->risk_percentage,
        ]);
    }
}
