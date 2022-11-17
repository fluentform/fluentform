<?php

namespace FluentForm\App\Http\Controllers;

use FluentForm\App\Services\Settings\SettingsService;
use FluentForm\Framework\Validator\ValidationException;

class FormSettingsController extends Controller
{
    public function index(SettingsService $settingsService)
    {
        $result = $settingsService->get($this->request->all());

        return $this->sendSuccess($result);
    }

    public function general(SettingsService $settingsService, $id)
    {
        $result = $settingsService->general($id);

        return $this->sendSuccess($result);
    }

    public function saveGeneral(SettingsService $settingsService)
    {
        try {
            $settingsService->saveGeneral($this->request->all());

            return $this->sendSuccess([
                'message' => __('Settings has been saved.', 'fluentform'),
            ]);
        } catch (ValidationException $exception) {
            return $this->sendError($exception->errors(), 422);
        }
    }

    public function store(SettingsService $settingsService)
    {
        try {
            [$settingsId, $settings] = $settingsService->store($this->request->all());

            return $this->sendSuccess([
                'message'  => __('Settings has been saved.', 'fluentform'),
                'id'       => $settingsId,
                'settings' => $settings,
            ]);
        } catch (ValidationException $exception) {
            return $this->sendError($exception->errors(), 422);
        }
    }

    public function remove(SettingsService $settingsService)
    {
        $settingsService->remove($this->request->all());

        wp_send_json([], 200);
    }
}
