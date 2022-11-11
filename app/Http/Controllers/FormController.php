<?php

namespace FluentForm\App\Http\Controllers;

use Exception;
use FluentForm\App\Services\Form\FormService;

class FormController extends Controller
{
    /**
     * Get the paginated forms matching search criteria.
     *
     * @param  \FluentForm\App\Services\Form\FormService $formService
     * @return \WP_REST_Response
     */
    public function index(FormService $formService)
    {
        return $this->sendSuccess(
            $formService->get($this->request->all())
        );
    }

    /**
     * Create a form from backend/editor
     *
     * @param  \FluentForm\App\Services\Form\FormService $formService
     * @return \WP_REST_Response
     */
    public function store(FormService $formService)
    {
        try {
            $form = $formService->store($this->request->all());

            return $this->sendSuccess([
                'formId'       => $form->id,
                'redirect_url' => admin_url(
                    'admin.php?page=fluent_forms&form_id=' . $form->id . '&route=editor'
                ),
                'message' => __('Successfully created a form.', 'fluentform'),
            ]);
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function duplicate(FormService $formService)
    {
        try {
            $form = $formService->duplicate($this->request->all());

            return $this->sendSuccess([
                'message'  => __('Form has been successfully duplicated.', 'fluentform'),
                'form_id'  => $form->id,
                'redirect' => admin_url('admin.php?page=fluent_forms&route=editor&form_id=' . $form->id),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function find(FormService $formService)
    {
        try {
            $id = $this->request->get('id');

            $form = $formService->find($id);

            return $this->sendSuccess($form, 200);
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function delete(FormService $formService)
    {
        try {
            $id = $this->request->get('id');

            $formService->delete($id);

            return $this->sendSuccess([
                'message' => __('Successfully deleted the form.', 'fluentform'),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function update(FormService $formService)
    {
        try {
            $formService->update($this->request->all());

            return $this->sendSuccess([
                'message' => __('The form is successfully updated.', 'fluentform'),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function convert(FormService $formService)
    {
        try {
            $formService->convert($this->request->get('id'));

            return $this->sendSuccess([
                'message' => __('The form is successfully converted.', 'fluentform'),
            ], 200);
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
