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
        Schema::create('trades', function (Blueprint $table) {
            $table->id();
            $table->dateTime('date');
            $table->string('pair', 10);
            $table->enum('direction', ['buy', 'sell']);
            $table->decimal('entry_price', 14, 5);
            $table->decimal('exit_price', 14, 5);
            $table->decimal('stop_loss', 14, 5)->nullable();
            $table->decimal('take_profit', 14, 5)->nullable();
            $table->decimal('lot_size', 8, 2)->default(0.01);
            $table->enum('result', ['win', 'loss', 'breakeven']);
            $table->decimal('pips', 10, 1)->nullable();
            $table->unsignedTinyInteger('confluence_score')->nullable();
            $table->text('setup_notes')->nullable();
            $table->text('entry_reason')->nullable();
            $table->text('exit_reason')->nullable();
            $table->string('emotions', 255)->nullable();
            $table->text('lessons')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trades');
    }
};
