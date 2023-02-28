<?php

namespace FluentForm\App\Http\Controllers;

use FluentForm\Framework\Validator\ValidationException;
use FluentForm\App\Services\RoleManager\RoleManagerService;

class RoleManagerController extends Controller
{
    public function index(RoleManagerService $roleManagerService)
    {
        $result = $roleManagerService->getRolesAndManager($this->request->all());
        return $this->sendSuccess($result);
    }
    
    public function addCapability(RoleManagerService $roleManagerService)
    {
        try {
            $result = $roleManagerService->setCapability($this->request->all());
            return $this->sendSuccess($result);
        } catch (ValidationException $exception) {
            return $this->sendError($exception->errors(), 422);
        }
    }
    
    public function addManager(RoleManagerService $roleManagerService)
    {
        try {
            $result = $roleManagerService->addManager($this->request->all());
            return $this->sendSuccess($result);
        } catch (ValidationException $exception) {
            return $this->sendError($exception->errors(), 422);
        }
    }
    
    public function removeManager(RoleManagerService $roleManagerService)
    {
        try {
            $result = $roleManagerService->removeManager($this->request->all());
            return $this->sendSuccess($result);
        } catch (ValidationException $exception) {
            return $this->sendError($exception->errors(), 422);
        }
    }
}
