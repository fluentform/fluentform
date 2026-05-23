<?php

namespace Dev\Test\Inc;

trait RefreshDatabase
{
	protected static $tables = [
		'users', 'usermeta',
		'posts', 'postmeta',
		'terms', 'termmeta',
		'comments', 'commentmeta',
		'links', 'tags', 'taggables',
		'term_taxonomy', 'term_relationships',
	];

	private function getNamespace()
	{
		static $ns;

		if (!$ns) {
			$ns = json_decode(
				file_get_contents(
					realpath(__DIR__.'/../../../composer.json')
				), true
			)['extra']['wpfluent']['namespace']['current'];
		}

		return $ns;
	}

	private function migrator()
	{
		return TestDBMigrator::class;
	}

	private function schema()
	{	
		return ($this->getNamespace().'\Framework\Database\Schema');
	}

	/**
	 * Suite-scoped lifecycle: migrate ONCE per test class, not per test.
	 * Bumps a class-static counter so anchor tests can prove the hook fired
	 * exactly once. Per-test cleanup happens via truncate in setUp() below.
	 */
	public static function setUpBeforeClass() : void
	{
		parent::setUpBeforeClass();

		TestDBMigrator::migrateUp();

		// Anchor tests opt-in via a class-static counter; harmless otherwise.
		if (property_exists(static::class, 'migrationsRanForThisClass')) {
			static::$migrationsRanForThisClass++;
		}
	}

	public static function tearDownAfterClass() : void
	{
		TestDBMigrator::migrateDown();

		parent::tearDownAfterClass();
	}

	public function setUp() : void
	{
		parent::setUp();

		$schema = $this->schema();

		// Per-test: truncate WP core tables AND plugin tables. Faster than
		// migrating up/down every test because schema-create is the expensive
		// step; TRUNCATE is constant-time. Resolved fresh each call so a new
		// table in getMigrations() is picked up without manual cache reset.
		foreach (static::$tables as $table) {
			$schema::truncateTableIfExists($table);
		}

		foreach (array_keys(TestDBMigrator::getMigrations()) as $table) {
			$schema::truncateTableIfExists($table);
		}
	}

	public function tearDown() : void
	{
		parent::tearDown();

		// No-op: per-test truncation is the responsibility of setUp() for the
		// NEXT test. tearDownAfterClass() handles the final drop.
	}
}
