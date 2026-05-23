<?php

namespace Dev\Test\Tests\Pro;

use Dev\Test\Inc\TestCase;
use FluentFormPro\Payments\Classes\CouponModel;

/**
 * Pro feature anchor — proves the free harness can exercise real Pro
 * business logic (CRUD round-trip on Pro's CouponModel via free's
 * wpFluent() DB helper). If this passes, "Option A" architecture
 * (free hosts harness, pro opt-in loaded) is validated for Wave 2B.
 *
 * Skipped cleanly when FLUENTFORM_PRO_TEST is not set.
 */
class TestCouponModelAnchor extends TestCase
{
    public static function setUpBeforeClass() : void
    {
        if (!defined('FLUENTFORM_PRO_TEST_LOADED')) {
            self::markTestSkipped('Pro not loaded (set FLUENTFORM_PRO_TEST=1 and check fluentformpro is checked out).');
        }

        parent::setUpBeforeClass();

        // CouponModel::migrate() creates the fluentform_coupons table.
        // free's RefreshDatabase::setUpBeforeClass migrated free tables but
        // not Pro tables; Pro modules manage their own schema.
        (new CouponModel)->migrate();
    }

    /**
     * Drop the Pro-owned coupons table at class teardown. free's
     * RefreshDatabase::tearDownAfterClass only drops tables in
     * TestDBMigrator::getMigrations() (free's 8 tables) — Pro-owned tables
     * must drop themselves so the schema doesn't leak into later test
     * classes that run in the same phpunit invocation.
     */
    public static function tearDownAfterClass() : void
    {
        global $wpdb;
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}fluentform_coupons");

        parent::tearDownAfterClass();
    }

    /**
     * Per-test truncate of the Pro-owned coupons table. free's
     * RefreshDatabase only truncates tables in TestDBMigrator::getMigrations()
     * (free's 8 tables) — Pro-owned tables must clean themselves between
     * tests to prevent state leak across methods.
     */
    public function setUp() : void
    {
        parent::setUp();
        global $wpdb;
        $wpdb->query("TRUNCATE TABLE {$wpdb->prefix}fluentform_coupons");
    }

    public function test_migrate_creates_coupons_table()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'fluentform_coupons';

        $exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table
        ));

        $this->assertSame($table, $exists, "Pro CouponModel::migrate must create {$table}");
    }

    public function test_insert_persists_coupon_returning_an_id()
    {
        $coupon = new CouponModel;

        $id = $coupon->insert([
            'code'       => 'SAVE10',
            'title'      => 'Save 10 (anchor)',
            'amount'     => 10,
            'min_amount' => 0,
            'coupon_type' => 'percent',
            'status'     => 'active',
            'stackable'  => 'no',
        ]);

        $this->assertGreaterThan(0, $id, 'insert() should return a non-zero ID');
    }

    public function test_getCouponByCode_returns_inserted_coupon()
    {
        $model = new CouponModel;

        $model->insert([
            'code'        => 'ROUNDTRIP',
            'title'       => 'Roundtrip Test',
            'amount'      => 25,
            'min_amount'  => 0,
            'coupon_type' => 'flat',
            'status'      => 'active',
            'stackable'   => 'no',
        ]);

        $found = $model->getCouponByCode('ROUNDTRIP');

        $this->assertNotNull($found, 'getCouponByCode should return an object');
        $this->assertSame('ROUNDTRIP', $found->code);
        $this->assertSame('Roundtrip Test', $found->title);
    }

    public function test_delete_removes_coupon()
    {
        $model = new CouponModel;

        $id = $model->insert([
            'code'        => 'DELETEME',
            'title'       => 'Delete me',
            'amount'      => 5,
            'min_amount'  => 0,
            'coupon_type' => 'percent',
            'status'      => 'active',
            'stackable'   => 'no',
        ]);

        $model->delete($id);

        global $wpdb;
        $count = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}fluentform_coupons WHERE id = %d",
            $id
        ));

        $this->assertSame(0, $count, 'delete() should remove the row');
    }
}
