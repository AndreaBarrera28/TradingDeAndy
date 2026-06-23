<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE trades MODIFY exit_price DECIMAL(14,5) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE trades MODIFY exit_price DECIMAL(14,5) NOT NULL');
    }
};
