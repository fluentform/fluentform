<?php

// Acceptance suite drives a served WordPress site over a real browser. The DB
// is reached through WPDb (not WPLoader), so just assert the sandbox guard.

\Tests\Support\GuardAgainstProductionDb::assertSandbox();
