<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trade extends Model
{
    protected $fillable = [
        'status', 'date', 'pair', 'direction', 'entry_price', 'exit_price',
        'stop_loss', 'take_profit', 'lot_size', 'result', 'pips',
        'confluence_score', 'confluence_factors', 'setup_notes', 'entry_reason', 'exit_reason',
        'emotions', 'lessons',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'entry_price' => 'decimal:5',
            'exit_price' => 'decimal:5',
            'stop_loss' => 'decimal:5',
            'take_profit' => 'decimal:5',
            'confluence_score' => 'integer',
            'confluence_factors' => 'array',
        ];
    }
}
