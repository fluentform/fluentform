<?php

// Runs after WPLoader has booted WordPress + FluentForm.

\Tests\Support\GuardAgainstProductionDb::assertSandbox();

// Activation hooks don't fire under WPLoader, so create the tables here.
\FluentForm\Database\DBMigrator::run();
