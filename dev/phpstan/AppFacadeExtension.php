<?php

declare(strict_types=1);

namespace FluentFormDev\PHPStan;

use PHPStan\Reflection\ClassReflection;
use PHPStan\Reflection\MethodReflection;
use PHPStan\Reflection\MethodsClassReflectionExtension;
use PHPStan\Reflection\ReflectionProvider;
use PHPStan\Type\MixedType;
use PHPStan\Type\Type;

/**
 * Teaches PHPStan about the WPFluent App facade and any subclass of it.
 *
 * App::__callStatic($method, $params) proxies to $instance->{$method}()
 * where $instance is an Application object. The Application class declares
 * its container bindings via @property annotations, e.g. @property Config $config.
 *
 * Without this extension PHPStan misreads the @method tags on App (treating
 * the "static" keyword as a return type, not a modifier) and reports every
 * App::config() / App::request() call as "Static call to instance method."
 *
 * Dynamic matching — no hardcoded method lists:
 *   1. The extension matches the framework facade class (APP_CLASS) AND any
 *      class that extends it (e.g. FluentForm\App\App). Subclass check uses
 *      $classReflection->isSubclassOf(self::APP_CLASS) so new subclasses are
 *      automatically covered without touching this file.
 *   2. A method name is accepted when the Application container class exposes
 *      it either as a @property annotation (hasProperty) or as a native method
 *      (hasNativeMethod). Both paths mirror what __callStatic actually does at
 *      runtime: it calls method_exists() first, then falls back to make().
 *   3. Return types are resolved from Application's @property annotations so
 *      App::config() is typed as Config, App::request() as Request, etc.
 *      If the type cannot be resolved the extension falls back to MixedType
 *      rather than failing analysis.
 */
final class AppFacadeExtension implements MethodsClassReflectionExtension
{
    private const APP_CLASS         = 'FluentForm\\Framework\\Foundation\\App';
    private const APPLICATION_CLASS = 'FluentForm\\Framework\\Foundation\\Application';

    private ReflectionProvider $reflectionProvider;

    public function __construct(ReflectionProvider $reflectionProvider)
    {
        $this->reflectionProvider = $reflectionProvider;
    }

    public function hasMethod(ClassReflection $classReflection, string $methodName): bool
    {
        // Accept the facade class itself and any subclass (e.g. FluentForm\App\App).
        $isFacade = $classReflection->getName() === self::APP_CLASS
            || $classReflection->isSubclassOf(self::APP_CLASS);

        if (!$isFacade) {
            return false;
        }

        return $this->applicationExposesComponent($methodName);
    }

    public function getMethod(ClassReflection $classReflection, string $methodName): MethodReflection
    {
        return new AppFacadeMethodReflection(
            $classReflection,
            $methodName,
            $this->resolveReturnType($methodName)
        );
    }

    /**
     * Returns true when Application declares $methodName as a @property or
     * as a native public instance method (so App::__callStatic can reach it).
     */
    private function applicationExposesComponent(string $methodName): bool
    {
        if (!$this->reflectionProvider->hasClass(self::APPLICATION_CLASS)) {
            return false;
        }

        $application = $this->reflectionProvider->getClass(self::APPLICATION_CLASS);

        return $application->hasProperty($methodName)
            || $application->hasNativeMethod($methodName);
    }

    /**
     * Resolves the return type from Application's @property annotation so
     * that App::config() is typed as Config, App::request() as Request, etc.
     */
    private function resolveReturnType(string $methodName): Type
    {
        if (!$this->reflectionProvider->hasClass(self::APPLICATION_CLASS)) {
            return new MixedType();
        }

        $application = $this->reflectionProvider->getClass(self::APPLICATION_CLASS);

        if ($application->hasProperty($methodName)) {
            try {
                $scope    = new \PHPStan\Analyser\OutOfClassScope();
                $property = $application->getProperty($methodName, $scope);
                return $property->getReadableType();
            } catch (\Throwable $e) {
                // Property declared in @property but type not resolvable
            }
        }

        return new MixedType();
    }
}
