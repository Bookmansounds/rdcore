<?php

namespace App\Controller;
use App\Controller\AppController;

use Cake\Core\Configure;
use Cake\Core\Configure\Engine\PhpConfig;
use Cake\I18n\FrozenTime;

use Cake\Utility\Inflector;

class DataCollectorsController extends AppController{

    protected $main_model = 'DataCollectors';
  
    public function initialize():void{  
        parent::initialize(); 
        $this->loadModel($this->main_model);   
        $this->loadModel('DynamicDetails');
        $this->loadModel('DynamicPairs');      
        $this->loadComponent('Aa');
        $this->loadComponent('JsonErrors'); 
        $this->loadComponent('TimeCalculations');         
    }
    
    public function macCheck(){
    
        $data	= $this->request->getData();      
        $q_r    = $this->_find_dynamic_detail_id();
        
        $data['ci_required']  = false; // By defaul don't ask for customer info;
                 
        if($q_r){

            //Once we found the Dynamic Login Page; We need to figure out if we need pop up the require customer info dialog
            //For that we need to look for a combo **dynamic_detail_id** and **mac**
            //IF found look at the modify timestamp and if it 'expired' ask for it again
            //If not found ask for it (ci_required == true)
            //Else we set ci_required == false since we found the combo and it has not expired yet  
            $dd_id          = $q_r->dynamic_detail_id;
            $dd_resuply_int = $q_r->dynamic_detail->dynamic_detail_ctc->ci_resupply_interval;
            $data['dd_id']  = $dd_id;          
            if($q_r->dynamic_detail->dynamic_detail_ctc->cust_info_check == true){
            
                if($dd_resuply_int == -1){
                    $data['ci_required'] = true; // Every time == -1 //No need to check if expired
                }else{       
                    $q_dd = $this->{$this->main_model}->find()
                        ->where([$this->main_model.'.dynamic_detail_id' => $dd_id,$this->main_model.'.mac' => $data['mac']])
                        ->order(['modified' => 'DESC']) //Get the most recent one 
                        ->first();
                    if($q_dd){
                        if($dd_resuply_int > 0){ //This has an expiry date lets compare           
                            $expiry_time    = $q_dd->modified->toUnixString()+($dd_resuply_int * 24 * 60 *60);
                            $now            = new FrozenTime();
                            if($expiry_time < $now->toUnixString()){
                                //It already expired ask for a new one
                                $data['ci_required'] = true;
                            }   
                        }
                    }else{
                        $data['ci_required'] = true; //We did not found it so have to supply customer info
                    }
                }
            }                                
        } 
        
        $this->set([
            'data'          => $data,
            'success'       => true,
            '_serialize'    => ['data','success']
        ]);
        
    }
    
    public function addMac(){
        if ($this->request->is('post')) { 
            if($this->request->getData('email')){
                if(!$this->_test_email($this->request->getData('email'))){
                    return;
                }
            }
            $req_d		= $this->request->getData();
            $dd 		= $this->_find_dynamic_detail_id();
            
            if(!$dd){
                $this->set(array(
                    'errors'    => ['email' => "Dynamic Login Page Not Found"],
                    'success'   => false,
                    'message'   => "Dynamic Login Page Not Found",
                    '_serialize' => array('errors','success','message')
                ));
                return;
            }else{
                $req_d['dynamic_detail_id'] = $dd->dynamic_detail->id;
            }
               
            $req_d['public_ip'] = $this->request->clientIp();
            $req_d['is_mobile'] = $this->request->isMobile();
            
            //See if there are not perhaps one already that just needs refreshing
            //== Record EVERY TIME ==
          /*  $q_dd = $this->{$this->main_model}->find()
                    ->where([
                        $this->main_model.'.dynamic_detail_id' => $dd->dynamic_detail->id,
                        $this->main_model.'.mac' => $req_d['mac']
                    ])
                    ->first();
            if($q_dd){
                $this->{$this->main_model}->patchEntity($q_dd, $req_d);
                $this->{$this->main_model}->save($q_dd);
            }else{ */     
                $entity = $this->{$this->main_model}->newEntity($req_d);
                $this->{$this->main_model}->save($entity);
          //  }
            
            $this->set(array(
                'success' => true,
                '_serialize' => array('success')
            ));
        }    
    }
    
     public function exportCsv(){

        //__ Authentication + Authorization __
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }
        
        $req_q 		= $this->request->getQuery();        
        $dd_id      = $req_q['dynamic_detail_id'];
        $query      = $this->{$this->main_model}->find()->where(['DataCollectors.dynamic_detail_id'=> $dd_id]);     
        $q_r    	= $query->all();

        //Headings
        $heading_line   = [];
        if(isset($req_q['columns'])){
            $columns = json_decode($req_q['columns']);
            foreach($columns as $c){
                array_push($heading_line,$c->name);
            }
        }
        $data = [
            $heading_line
        ];
        
        foreach($q_r as $i){
            $columns    = [];
            $csv_line   = [];
            if(isset($req_q['columns'])){
                $columns = json_decode($req_q['columns']);
                foreach($columns as $c){
                    $column_name = $c->name;
                    array_push($csv_line,$i->{$column_name});
                }
                array_push($data,$csv_line);
            }
        }
                
        $_serialize = 'data';
        $this->setResponse($this->getResponse()->withDownload('export.csv'));
        $this->viewBuilder()->setClassName('CsvView.Csv');
        $this->set(compact('data', '_serialize'));  
         
    } 
    
    public function index(){
        //__ Authentication + Authorization __
        $user = $this->_ap_right_check();
        if (!$user) {
            return;
        }
        $user_id    = $user['id'];
        $req_q 		= $this->request->getQuery();
        $dd_id      = $req_q['dynamic_detail_id'];
        $query      = $this->{$this->main_model}->find()
            ->where(['DataCollectors.dynamic_detail_id'=> $dd_id])
            ->contain(['DynamicDetails']);

        //===== PAGING (MUST BE LAST) ======
        $limit = 50;   //Defaults
        $page = 1;
        $offset = 0;
        if (isset($req_q['limit'])) {
            $limit 	= $req_q['limit'];
            $page 	= $req_q['page'];
            $offset = $req_q['start'];
        }

        $query->page($page);
        $query->limit($limit);
        $query->offset($offset);

        $total = $query->count();
        $q_r = $query->all();

        $items = [];

        foreach ($q_r as $i) {         
            $row        = [];
            $fields     = $this->{$this->main_model}->setSchema()->columns();
            foreach($fields as $field){
                $row["$field"]= $i->{"$field"};
                if($field == 'created'){
                    $row['created_in_words'] = $this->TimeCalculations->time_elapsed_string($i->{"$field"});
                }
                if($field == 'modified'){
                    $row['modified_in_words'] = $this->TimeCalculations->time_elapsed_string($i->{"$field"});
                }   
            } 
            $row['dynamic_detail_name'] = $i->dynamic_detail->name;             
			$row['update']		= 'true';
			$row['delete']		= 'true';       
            array_push($items, $row);
        }

        $this->set([
            'items' => $items,
            'success' => true,
            'totalCount' => $total,
            '_serialize' => ['items', 'success', 'totalCount']
        ]);
    }
    
    public function add(){
    
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }
        
        $this->_addOrEdit($user,'add');
        
    }
    
    public function edit(){
    
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }
        $this->_addOrEdit($user,'edit');
        
    }
    
    private function _test_email($email){
    
        //Do some validity test for email
        $pieces = explode("@", $email);
        $domain = $pieces[1]; 
        if(!checkdnsrr($domain)){
            $this->set(array(
                'errors'    => ['email' => "Domain $domain is not valid"],
                'success'   => false,
                'message'   => "Domain $domain is not valid",
                '_serialize' => array('errors','success','message')
            ));
            return false;
        }     
        return true;  
    }
    
    private function _find_dynamic_detail_id(){
    
        $result = false;
        $req_d	= $this->request->getData();
        $conditions = array("OR" =>array());
        foreach(array_keys($req_d) as $key){
            array_push($conditions["OR"],
                array("DynamicPairs.name" => $key, "DynamicPairs.value" =>  $req_d[$key])
            ); //OR query all the keys
        }
       	
		$q_r = $this->DynamicPairs
            ->find()
            ->contain([
                'DynamicDetails' => ['DynamicDetailCtcs']
            ])
            ->where([$conditions])
            ->order(['DynamicPairs.priority' => 'DESC'])
            ->first();
      
        if($q_r){
            $result = $q_r;
            return $result;
        }
    }
    
    
    private function _addOrEdit($user,$type= 'add') {

        //__ Authentication + Authorization __
        
        $user_id    = $user['id'];
        $req_d	    = $this->request->getData();
        
        if($this->request->getData('email')){
            if(!$this->_test_email($req_d['email'])){
                return;
            }
        }
        
        $req_d['public_ip'] = $this->request->clientIp();
        $req_d['is_mobile'] = $this->request->isMobile();
       
        if($type == 'add'){ 
            $entity = $this->{$this->main_model}->newEntity($req_d);
        }
       
        if($type == 'edit'){
            $entity = $this->{$this->main_model}->get($req_d['id']);
            $this->{$this->main_model}->patchEntity($entity, $req_d);
        }
              
        if ($this->{$this->main_model}->save($entity)) {
            $this->set(array(
                'success' => true,
                '_serialize' => array('success')
            ));
        } else {
            $message = __('Could not update item');
            $this->JsonErrors->entityErros($entity,$message);
        }
	}
	
	 public function delete() {
		if (!$this->request->is('post')) {
			throw new MethodNotAllowedException();
		}

        //__ Authentication + Authorization __
        $user = $this->_ap_right_check();
        if(!$user){
            return;
        }

        $user_id    = $user['id'];
        $fail_flag  = false;
        $req_d		= $this->request->getData();

	    if(isset($req_d['id'])){   //Single item delete       
            $entity     = $this->{$this->main_model}->get($req_d['id']);   
            $this->{$this->main_model}->delete($entity);

        }else{
            foreach($req_d as $d){
                $entity     = $this->{$this->main_model}->get($d['id']);  
                $this->{$this->main_model}->delete($entity);
            }
        }     

        if($fail_flag == true){
            $this->set(array(
                'success'   => false,
                'message'   => array('message' => __('Could not delete some items')),
                '_serialize' => array('success','message')
            ));
        }else{
            $this->set(array(
                'success' => true,
                '_serialize' => array('success')
            ));
        }
	}
}
