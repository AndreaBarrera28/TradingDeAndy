<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('account_balance', 14, 2)->default(0)->after('password');
            $table->decimal('risk_percentage', 5, 2)->default(1.00)->after('account_balance');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['account_balance', 'risk_percentage']);
        });
    }
};
