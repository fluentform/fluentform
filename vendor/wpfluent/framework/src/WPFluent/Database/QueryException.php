<?php

namespace FluentForm\Framework\Database;

use Throwable;
use PDOException;

class QueryException extends PDOException
{

	/**
	 * The SQL for the query.
	 *
	 * @var string
	 */
	protected $sql;

	/**
	 * The bindings for the query.
	 *
	 * @var array
	 */
	protected $bindings;

	/**
     * Create a new query exception instance.
     *
     * @param  string  $sql
     * @param  array  $bindings
     * @param  \Throwable  $previous
     * @return void
     */
    public function __construct($sql, array $bindings, Throwable $previous)
    {
        parent::__construct('', 0, $previous);

        $this->sql = $sql;
        $this->bindings = $bindings;
        $this->code = $previous->getCode();
        $this->message = $this->formatMessage($sql, $bindings, $previous);

        if ($previous instanceof PDOException) {
            $this->errorInfo = $previous->errorInfo;
        }
    }

	/**
	 * Format the SQL error message.
	 *
	 * @param  string  $sql
	 * @param  array  $bindings
	 * @param  \Exception $previous
	 * @return string
	 */
	protected function formatMessage($sql, $bindings, $previous)
	{
		$message = $this->strReplaceArray('\?', $bindings, $sql);

		return $previous->getMessage() . ' (SQL: ' . $message . ')';
	}

	/**
	 * Get the SQL for the query.
	 *
	 * @return string
	 */
	public function getSql()
	{
		return $this->sql;
	}

	/**
	 * Get the bindings for the query.
	 *
	 * @return array
	 */
	public function getBindings()
	{
		return $this->bindings;
	}

	/**
	 * Replace placeholders with bindings
	 * 
	 * @param  string $search
	 * @param  array  $replace
	 * @param  string $subject
	 * @return string $subject
	 */
	protected function strReplaceArray($search, array $replace, $subject)
    {
        foreach ($replace as $value) {
            $subject = preg_replace('/' . $search . '/', $value, $subject, 1);
        }

        return $subject;
    }
}
