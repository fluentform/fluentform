<?php

declare(strict_types=1);

namespace FluentFormDev\PHPStan;

use PHPStan\Reflection\ClassReflection;
use PHPStan\Reflection\MethodReflection;
use PHPStan\Reflection\MethodsClassReflectionExtension;
use PHPStan\Reflection\ReflectionProvider;
use PHPStan\Type\MixedType;

/**
 * Teaches PHPStan about WPFluent DatabaseManager dynamic method calls.
 *
 * DatabaseManager::__call checks method_exists($connection, $method) and only
 * delegates when the method actually exists on the active WPDBConnection — it
 * throws BadMethodCallException otherwise. This extension mirrors that runtime
 * contract: a method is accepted on DatabaseManager only when it is declared
 * natively on ConnectionInterface or WPDBConnection (including trait methods
 * from ManagesTransactions / DetectsLostConnections).
 *
 * This means genuine typos (App::db()->tabel()) are still caught by PHPStan.
 */
final class DatabaseManagerExtension implements MethodsClassReflectionExtension
{
    private const DATABASE_MANAGER = 'FluentForm\\Framework\\Database\\DatabaseManager';
    private const CONNECTION_IFACE = 'FluentForm\\Framework\\Database\\ConnectionInterface';
    private const WPDB_CONNECTION  = 'FluentForm\\Framework\\Database\\Query\\WPDBConnection';

    private ReflectionProvider $reflectionProvider;

    public function __construct(ReflectionProvider $reflectionProvider)
    {
        $this->reflectionProvider = $reflectionProvider;
    }

    public function hasMethod(ClassReflection $classReflection, string $methodName): bool
    {
        if ($classReflection->getName() !== self::DATABASE_MANAGER
            && !$classReflection->isSubclassOf(self::DATABASE_MANAGER)
        ) {
            return false;
        }

        foreach ([self::CONNECTION_IFACE, self::WPDB_CONNECTION] as $fqcn) {
            if ($this->reflectionProvider->hasClass($fqcn)
                && $this->reflectionProvider->getClass($fqcn)->hasNativeMethod($methodName)
            ) {
                return true;
            }
        }

        return false;
    }

    public function getMethod(ClassReflection $classReflection, string $methodName): MethodReflection
    {
        return new AppFacadeMethodReflection($classReflection, $methodName, new MixedType(), false);
    }
}
