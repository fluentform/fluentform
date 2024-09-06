<?php

namespace FluentForm\Framework\Database;

use FluentForm\Framework\Foundation\App;
use FluentForm\Framework\Database\ConnectionResolverInterface;

class ConnectionResolver implements ConnectionResolverInterface
{
    /**
     * All of the registered connections.
     *
     * @var array
     */
    protected $connections = [];

    /**
     * The default connection name.
     *
     * @var string
     */
    protected $default;

    /**
     * Create a new connection resolver instance.
     *
     * @param  array  $connections
     * @return void
     */
    public function __construct(array $connections = [])
    {
        foreach ($connections as $name => $connection) {
            $this->addConnection($name, $connection);
        }
    }

    /**
     * Get a database connection instance.
     *
     * @param  string|null  $name
     * @return \FluentForm\Framework\Database\ConnectionInterface
     */
    public function connection($name = null)
    {
        if ($name instanceof ConnectionInterface) {
            return $name;
        }

        if (is_null($name)) {
            return $this->getDefaultConnection();
        }

        if (isset($this->connections[$name])) {
            return $this->connections[$name];
        }

        return $this->getDefaultConnection();
    }

    /**
     * Add a connection to the resolver.
     *
     * @param  string  $name
     * @param  \FluentForm\Framework\Database\ConnectionInterface  $connection
     * @return void
     */
    public function addConnection($name, ConnectionInterface $connection)
    {
        $this->connections[$name] = $connection;
    }

    /**
     * Check if a connection has been registered.
     *
     * @param  string  $name
     * @return bool
     */
    public function hasConnection($name)
    {
        return isset($this->connections[$name]);
    }

    /**
     * Get the default connection name.
     *
     * @return string
     */
    public function getDefaultConnection()
    {
        return $this->default ?: App::getInstance('db');
    }

    /**
     * Set the default connection name.
     *
     * @param  string  $name
     * @return void
     */
    public function setDefaultConnection($name)
    {
        $this->default = $name;
    }
}
