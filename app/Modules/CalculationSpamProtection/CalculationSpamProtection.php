<?php

namespace FluentForm\App\Modules\CalculationSpamProtection;

class CalculationSpamProtection
{
    /**
     * Generate a random calculation question.
     *
     * @param string
     * @return array
     */
    public static function generateQuestion($difficulty = 'medium')
    {
        $ranges = [
            'easy'   => [
                'min' => 1,
                'max' => 9
            ],
            'medium' => [
                'min' => 10,
                'max' => 99
            ],
            'hard'   => [
                'min' => 100,
                'max' => 999
            ],
        ];
        
        $range = isset($ranges[$difficulty]) ? $ranges[$difficulty] : $ranges['medium'];
        
        $num1 = rand($range['min'], $range['max']);
        $num2 = rand($range['min'], $range['max']);
        $operator = rand(0, 1) ? '+' : '-';
        
        if ($operator === '-') {
            if ($num1 < $num2) {
                $temp = $num1;
                $num1 = $num2;
                $num2 = $temp;
            }
        }
        
        $answer = $operator === '+' ? ($num1 + $num2) : ($num1 - $num2);
        
        $encryptedAnswer = self::encryptAnswer($answer);
        
        return [
            'question' => sprintf('%d %s %d = ?', $num1, $operator, $num2),
            'answer' => $encryptedAnswer,
            'operator' => $operator
        ];
    }
    
    /**
     * Validate calculation answer.
     *
     * @param string $userAnswer The answer provided by the user
     * @param string $encryptedAnswer The encrypted correct answer
     *
     * @return bool
     */
    public static function validate($userAnswer, $encryptedAnswer)
    {
        if (empty($userAnswer) || empty($encryptedAnswer)) {
            return false;
        }
        
        $encryptedAnswer = trim($encryptedAnswer);
        
        $correctAnswer = self::decryptAnswer($encryptedAnswer);
        
        if ($correctAnswer === false) {
            return false;
        }
        
        $userAnswer = trim((string) $userAnswer);
        $correctAnswer = (int) $correctAnswer;
        $userAnswerInt = (int) $userAnswer;
        
        $isValid = $userAnswerInt === $correctAnswer;
        
        return $isValid;
    }
    
    /**
     * Encrypt the answer for security.
     * Uses hex encoding which is safe for sanitize_text_field()
     *
     * @param int $answer
     *
     * @return string
     */
    private static function encryptAnswer($answer)
    {
        $salt = wp_salt('fluentform_calculation');
        $data = $answer . '|' . hash('sha256', $answer . $salt);
        return bin2hex($data);
    }
    
    /**
     * Decrypt and validate the answer.
     *
     * @param string $encrypted
     *
     * @return int|false
     */
    private static function decryptAnswer($encrypted)
    {
        $encrypted = trim($encrypted);
        
        $decoded = @hex2bin($encrypted);
        if ($decoded === false) {
            return false;
        }
        
        $parts = explode('|', $decoded);
        if (count($parts) !== 2) {
            return false;
        }
        
        [$answer, $hash] = $parts;
        
        $salt = wp_salt('fluentform_calculation');
        $expectedHash = hash('sha256', $answer . $salt);
        
        if (!hash_equals($expectedHash, $hash)) {
            return false;
        }
        
        return (int) $answer;
    }
}

