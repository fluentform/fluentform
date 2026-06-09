<?php

// Runs AFTER WPLoader has booted WordPress + FluentForm. The real pre-WPLoader
// gates are the ./wpf pre-flight and the scoped DB user; this is the final
// defense-in-depth check (and live-connection cross-check) for raw codecept runs.
\Tests\Support\GuardAgainstProductionDb::assertSandbox();

// Activation hooks don't fire under WPLoader, so create the tables here.
\FluentForm\Database\DBMigrator::run();
