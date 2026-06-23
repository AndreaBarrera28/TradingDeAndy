<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('trades', function (Blueprint $table) {
            $table->string('status', 10)->default('closed')->after('id');
            $table->json('confluence_factors')->nullable()->after('confluence_score');
        });

        Schema::table('trades', function (Blueprint $table) {
            $table->string('result', 10)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('trades', function (Blueprint $table) {
            $table->dropColumn(['status', 'confluence_factors']);
            DB::statement("ALTER TABLE trades MODIFY result ENUM('win','loss','breakeven') NOT NULL");
        });
    }
};
