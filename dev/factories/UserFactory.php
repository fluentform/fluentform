<?php

namespace Dev\Factories;

// use PluginNamespace\App\Models\User;
use Dev\Factories\Core\Factory;

class UserFactory extends Factory
{
	// Required to use Factory::create method
	// protected static $model = User::class;

	public function defination($data = [])
	{
		return [
			'user_login' => $this->fake->name,
			'user_pass' => wp_hash_password(12345678),
			'post_email' => $this->fake->email,
		];
	}
}
