<?php
/**
 * Server-side conditional visibility must CASCADE like the client
 * (resources/assets/public/Pro/_ConditionClass.js): a field is visible only
 * when its own condition matches AND every conditional controller it references
 * is itself visible. This distinguishes the two reasons a referenced field is
 * absent from a submission:
 *   - a HIDDEN controller -> the dependent is hidden too (so a chained-hidden
 *     required field is not wrongly required); and
 *   - an empty SCALAR controller (text/select/hidden/radio) -> the dependent is
 *     hidden too, because the client coerces ''/missing to null and null fails
 *     every operator except "= ''" and regex; while
 *   - an unselected ARRAY controller (checkbox/multiselect) -> the dependent is
 *     kept, because [] != value is true on the client (#814 preserved).
 *
 * assess() is untouched, so notification/confirmation/ff_if gating is unchanged.
 *
 * Run: php dev/tests/test_conditional_cascade.php
 */
error_reporting(E_ALL & ~E_DEPRECATED);
$r = ['pass'=>0,'fail'=>0];
function check($c,$l){ global $r; if($c){$r['pass']++;echo "  PASS  $l\n";}else{$r['fail']++;echo "  FAIL  $l\n";} }

if (!class_exists('FluentForm\Framework\Helpers\ArrayHelper')) require_once __DIR__.'/stubs/CascadeArrayHelper.php';
require_once __DIR__.'/../../app/Services/ConditionAssesor.php';
use FluentForm\App\Services\ConditionAssesor;

$vis = function($n,$map,$in){ return ConditionAssesor::isConditionallyVisible($n,$map,$in); };

/* Chained conditional: a controller hidden by its own conditional hides the dependent. */
$mapHidden = [
    'gate'      => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'toggle','operator'=>'=','value'=>'yes']]],
    'dependent' => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'gate','operator'=>'!=','value'=>'no']]],
];
check($vis('gate',$mapHidden,['toggle'=>'no']) === false, 'gate hidden when toggle != yes');
check($vis('dependent',$mapHidden,['toggle'=>'no']) === false, 'dependent HIDDEN because its controller (gate) is hidden');
check($vis('dependent',$mapHidden,['toggle'=>'yes','gate'=>'yes']) === true, 'dependent visible when controller visible and gate != no');
check($vis('dependent',$mapHidden,['toggle'=>'yes','gate'=>'no']) === false, 'dependent hidden when gate = no');

/* Empty SCALAR controller, browser parity (_ConditionClass.js coerces ''/missing
 * to null, and null fails every operator except "= ''" and regex), so the
 * browser hides "!=" dependents of an empty text/select/hidden/radio control. */
$mapVisible = [
    'dependent' => ['status'=>true,'type'=>'all','conditions'=>[['field'=>'choice','operator'=>'!=','value'=>'Option 1']]],
];
check($vis('dependent',$mapVisible,['choice'=>'']) === false, 'dependent HIDDEN when scalar controller is present but empty (browser parity)');
check($vis('dependent',$mapVisible,[]) === false, 'dependent HIDDEN when scalar controller is missing (unselected radio, browser parity)');
check($vis('dependent',$mapVisible,['choice'=>'Option 1']) === false, 'dependent hidden when choice = Option 1');
check($vis('dependent',$mapVisible,['choice'=>'Option 2']) === true, 'dependent visible when choice has a non-matching value');
check($vis('choice',$mapVisible,['x'=>'y']) === true, 'non-conditional field always visible');

/* Form 483 reproduction: hidden input controller submitted as "" must hide its
 * "!=" dependents exactly like the browser did. */
$map483 = [
    'Abstellort' => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'KdKlasse','operator'=>'!=','value'=>'3']]],
];
check($vis('Abstellort',$map483,['KdKlasse'=>'']) === false, 'form 483: required dependent hidden when hidden-input controller is empty');
check($vis('Abstellort',$map483,['KdKlasse'=>'1']) === true, 'form 483: dependent visible when controller is 1 (!= 3)');
check($vis('Abstellort',$map483,['KdKlasse'=>'3']) === false, 'form 483: dependent hidden when controller is 3');

/* Empty "=" still matches like the browser: "= ''" is satisfied by an empty controller. */
$mapEq = [
    'dependent' => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'choice','operator'=>'=','value'=>'']]],
];
check($vis('dependent',$mapEq,['choice'=>'']) === true, 'dependent visible when "= empty" matches an empty controller');
check($vis('dependent',$mapEq,['choice'=>'x']) === false, 'dependent hidden when "= empty" sees a value');

/* Empty ARRAY controller (unselected checkbox/multiselect, the #814 case): the
 * browser keeps "!=" dependents because [] != value is true. The server is told
 * which controllers are array-typed via the arrayControllers argument. */
$arrayControllers = ['boxes' => true];
$mapArray = [
    'dependent' => ['status'=>true,'type'=>'all','conditions'=>[['field'=>'boxes','operator'=>'!=','value'=>'Option 1']]],
];
$emptyIn = [];
check(ConditionAssesor::isConditionallyVisible('dependent',$mapArray,$emptyIn,null,[],$arrayControllers) === true, 'dependent KEPT when an array controller (checkbox/multiselect) is unselected (#814 preserved)');
$pickedIn = ['boxes'=>['Option 1']];
check(ConditionAssesor::isConditionallyVisible('dependent',$mapArray,$pickedIn,null,[],$arrayControllers) === false, 'dependent hidden when the array controller picked the matching value');
$otherIn = ['boxes'=>['Option 2']];
check(ConditionAssesor::isConditionallyVisible('dependent',$mapArray,$otherIn,null,[],$arrayControllers) === true, 'dependent visible when the array controller picked another value');

/* Container conditions: the client attaches container_condition to every field
 * inside a conditional container (FormBuilder::extractConditionalLogic) and the
 * evaluator ANDs it in (_ConditionClass.js). A controller inside a hidden
 * container must hide its outside dependents. */
$mapContainer = [
    // controller has NO own logic; it sits in a container shown when mode = b
    'inner_ctrl' => ['conditions'=>[], 'status'=>false, 'type'=>'any',
        'container_condition'=>['status'=>true,'type'=>'any','conditions'=>[['field'=>'mode','operator'=>'=','value'=>'b']]]],
    'dependent'  => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'inner_ctrl','operator'=>'=','value'=>'']]],
];
$inContainerHidden = ['mode'=>'a'];
check(ConditionAssesor::isConditionallyVisible('inner_ctrl',$mapContainer,$inContainerHidden) === false, 'container: field with no own logic hidden when its container is hidden');
check(ConditionAssesor::isConditionallyVisible('dependent',$mapContainer,$inContainerHidden) === false, 'container: "= empty" dependent hidden when controller container is hidden');
$inContainerShown = ['mode'=>'b'];
check(ConditionAssesor::isConditionallyVisible('inner_ctrl',$mapContainer,$inContainerShown) === true, 'container: field visible when container condition passes');
check(ConditionAssesor::isConditionallyVisible('dependent',$mapContainer,$inContainerShown) === true, 'container: "= empty" dependent visible when container shown and controller empty');

/* Checkbox controller inside a hidden container: without container awareness the
 * array rule ([] satisfies !=) would wrongly keep the dependent. */
$mapBoxInContainer = [
    'boxes'     => ['conditions'=>[], 'status'=>false, 'type'=>'any',
        'container_condition'=>['status'=>true,'type'=>'any','conditions'=>[['field'=>'mode','operator'=>'=','value'=>'b']]]],
    'dependent' => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'boxes','operator'=>'!=','value'=>'X']]],
];
$inBox = ['mode'=>'a'];
check(ConditionAssesor::isConditionallyVisible('dependent',$mapBoxInContainer,$inBox,null,[],['boxes'=>true]) === false, 'container: "!=" dependent of an unselected checkbox hidden when the checkbox container is hidden');
$inBox2 = ['mode'=>'b'];
check(ConditionAssesor::isConditionallyVisible('dependent',$mapBoxInContainer,$inBox2,null,[],['boxes'=>true]) === true, 'container: "!=" dependent kept when checkbox container is visible and checkbox unselected (#814)');

/* Own condition AND container condition must BOTH pass. */
$mapBoth = [
    'field' => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'toggle','operator'=>'=','value'=>'on']],
        'container_condition'=>['status'=>true,'type'=>'any','conditions'=>[['field'=>'mode','operator'=>'=','value'=>'b']]]],
];
$bothIn = ['toggle'=>'on','mode'=>'b'];
check(ConditionAssesor::isConditionallyVisible('field',$mapBoth,$bothIn) === true, 'container: own + container both pass -> visible');
$ownOnly = ['toggle'=>'on','mode'=>'a'];
check(ConditionAssesor::isConditionallyVisible('field',$mapBoth,$ownOnly) === false, 'container: own passes, container fails -> hidden');
$contOnly = ['toggle'=>'off','mode'=>'b'];
check(ConditionAssesor::isConditionallyVisible('field',$mapBoth,$contOnly) === false, 'container: own fails, container passes -> hidden');

/* Chained THROUGH a container: container condition references a field that is
 * itself conditionally hidden -> container hidden -> inner field hidden. */
$mapChainCont = [
    'gate' => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'toggle','operator'=>'=','value'=>'on']]],
    'inner' => ['conditions'=>[], 'status'=>false, 'type'=>'any',
        'container_condition'=>['status'=>true,'type'=>'any','conditions'=>[['field'=>'gate','operator'=>'=','value'=>'go']]]],
    'dependent' => ['status'=>true,'type'=>'any','conditions'=>[['field'=>'inner','operator'=>'=','value'=>'']]],
];
$chainIn = ['toggle'=>'off','gate'=>'go'];
check(ConditionAssesor::isConditionallyVisible('inner',$mapChainCont,$chainIn) === false, 'container chain: container controller itself hidden -> inner hidden (forged gate value ignored)');
check(ConditionAssesor::isConditionallyVisible('dependent',$mapChainCont,$chainIn) === false, 'container chain: dependent of inner hidden too');

/* Circular dependency must resolve to hidden without looping. */
$circ = [
    'a'=>['status'=>true,'type'=>'any','conditions'=>[['field'=>'b','operator'=>'!=','value'=>'x']]],
    'b'=>['status'=>true,'type'=>'any','conditions'=>[['field'=>'a','operator'=>'!=','value'=>'x']]],
];
$empty=[];
check(ConditionAssesor::isConditionallyVisible('a',$circ,$empty) === false, 'circular dependency resolves to hidden without infinite loop');

/* assess()/evaluate() untouched: the flat gating path still treats missing as empty. */
$flat = ['conditionals'=>$mapHidden['dependent']];
$in = ['toggle'=>'no'];
check(ConditionAssesor::evaluate($flat,$in) === true, 'evaluate() default (gating) unchanged: missing treated as empty');

echo "\n  ".$r['pass']." passed, ".$r['fail']." failed\n";
exit($r['fail']>0?1:0);
