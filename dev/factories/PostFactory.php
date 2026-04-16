<?php

namespace Dev\Factories;

// use PluginNamespace\App\Models\Post;
use Dev\Factories\Core\Factory;

class PostFactory extends Factory
{
	// Required to use Factory::create method
	// protected static $model = Post::class;

	public function defination($data = [])
	{
		return [
			'post_author' => $data['ID'],
			'post_title' => $this->fake->sentence(2),
			'post_content' => $this->fake->paragraph(5)
		];
	}
}
