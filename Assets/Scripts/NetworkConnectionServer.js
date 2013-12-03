var TOP_SCORES = 10;

var remoteIP = "127.0.0.1";
var remotePort = 25000;
var listenPort = 25000;
var useNAT = false;
var yourIP = "";
var yourPort = "";

var newSkin: GUISkin;

//BLs
var areaWidth : float;
var areaHeight : float;
var backgroundTexture : Texture;
var startBtnTexture: Texture;

var isPlaying: boolean;
var burnedCalories: float;
var gameTime: int;  // Time in minutes to stop the game.
var meters: float;
var elapsedTime: float;
var interpreterName:String;
var interpreterID:String;
var topScores:String = "";
private var ScreenX: float;
private var ScreenY: float;

private var _scoresCount: int;
private var _scoreValues:ArrayList;
private var _scoreNames: ArrayList;
private var _numWalkSteps: int;
private var _numSwimSteps: int;
private var _startTime: float;
private var _metersXWalkSteps:float;
private var _metersXSwimSteps:float;
private var _playerNumber: int;
private var _currentYear:int;
private var _durationGame:int;
private var _showGraphView:boolean;
private var _showSummary:boolean;
private var _goalReached:boolean;
private var _timerReached:boolean;
private var _currentAvg:float;
private var _minYear : int = 0;
private var _maxYear : int = 2;
private var _serverReady : boolean;
private var _playerName : String;
private var _initialPos : Vector2;
private var _currentPos : Vector2;
private var _displaySeconds: int;
private var _displayMinutes: int;
private var _savedAvg: boolean;
private var _savedLog: boolean;
private var _scoresLoaded: boolean;
private var _showInfo:boolean;
private var _showMap:boolean;
private var _showCurrentGraph:boolean;
private var _showInterpreterList:boolean = false;

var yearList : int[] = [1975,2010,2045];
private var _yearAgoList : int[]= [-35,0,35];
private var _yearLabels : String[]= ["1975","2010","2045"];
var gameDurationList: int[] = [1,3,5];
private var _DBParameters;
var applicationPath:String = "";

private var _innerController : int;			 
			       
//variable for the heigh of the lable text
private var _labelHeight :float;
			       
 
function Start(){
  // BL added for screen distribution of elements
    ScreenX = ((Screen.width * 0.5) - (areaWidth * 0.5));
    ScreenY = ((Screen.height * 0.5) - (areaHeight * 0.5));
	
	_labelHeight = areaHeight*0.04;
	
	GetComponent(GameParameters).labelHeight = _labelHeight;
	GetComponent(GameParameters).posX = areaWidth*0.5;       
	GetComponent(GameParameters).posY = areaHeight*0.12 + _labelHeight ;
	
    GetComponent(BurnedCaloriesGraph).posX = ScreenX + areaWidth*0.575;       
	GetComponent(BurnedCaloriesGraph).posY = Screen.height - (ScreenY + areaHeight*0.625);
	
	GetComponent(BurnedCaloriesGraph).width = areaWidth*0.35;       
	GetComponent(BurnedCaloriesGraph).height = areaHeight*0.35;
	
	GetComponent(CurrentPosInMap).posX = 0;
	GetComponent(CurrentPosInMap).posY = 0;
	GetComponent(CurrentPosInMap).mapWidth = areaWidth*0.4;
	GetComponent(CurrentPosInMap).mapHeight = areaHeight*0.4;
	
	GetComponent(SummaryGraph).posX = ScreenX + areaWidth*0.125;
	GetComponent(SummaryGraph).posY = Screen.height - (ScreenY  + areaHeight*0.725);
	GetComponent(SummaryGraph).height = areaHeight*0.45;
	GetComponent(SummaryGraph).width = areaWidth*0.425;
	GetComponent(SummaryGraph).numYears = yearList.Length;

    GetComponent(InfoPolarBear).posX = areaWidth*0.1;
	GetComponent(InfoPolarBear).posY = areaHeight*0.1;
	GetComponent(InfoPolarBear).infoWidth = areaWidth*0.8;
	GetComponent(InfoPolarBear).infoHeight = areaHeight*0.8;
	
    Initialize();
    
    applicationPath = Application.dataPath;
    if (Application.platform == RuntimePlatform.OSXPlayer) {
        applicationPath += "/../../";
    }
    else if (Application.platform == RuntimePlatform.WindowsPlayer) {
        applicationPath += "/../";
    }

}

function Initialize(){
	_scoreValues = new ArrayList();
	_scoreNames = new ArrayList();
	interpreterName = "Interpreter...";
    _displayMinutes = 0;
    elapsedTime = 0;
	_currentYear = _minYear;
	_showGraphView = false;
	isPlaying = false;
	_innerController = 1;
	_serverReady = false;	
	_numSwimSteps = _numWalkSteps = _playerNumber = 0;
	burnedCalories = meters = _displaySeconds = _displayMinutes = 0;
	_playerName = "Player name ...";
	_goalReached = false;
	_timerReached = false;
	_initialPos = new Vector2(0.0,0.0);
	_currentPos = new Vector2(0.0,0.0);
    _savedAvg = false;
    _savedLog = false;
    topScores = "";
    
	var  _map : Texture2D = Resources.Load("Images/"+yearList[_currentYear]+"_Location_Map", typeof(Texture2D));
	GetComponent(CurrentPosInMap).mapImage = _map;
	GetComponent(BurnedCaloriesGraph).DestroyLines();
	GetComponent(CurrentPosInMap).InitializeMap();
	GetComponent(DatabaseConnection).GetInterpreters();
	GetComponent(Prompts).ShowPrompts(false);
	LoadScores();
	
}

function StartGame(){
	_currentYear = GetComponent(GameParameters).getCurrentYearIndex();
	_durationGame = GetComponent(GameParameters).getDurationGameIndex();
	_startTime = Time.realtimeSinceStartup;
	GetComponent(SummaryGraph).SetCurrentYear(_currentYear);
    isPlaying = true;
    networkView.RPC ("LoadLevelInClient", RPCMode.Others, yearList[_currentYear].ToString()+":"+_yearAgoList[_currentYear].ToString());  
    GetComponent(Prompts).ShowPrompts(true);
}

function OnConnectedToServer () {
    Debug.Log("Connected to Server... ");
    
	// Notify our objects that the level and the network are ready
	for (var go : GameObject in FindObjectsOfType(GameObject))
		go.SendMessage("OnNetworkLoadedLevel", SendMessageOptions.DontRequireReceiver);
}
function Update(){		
	if (Network.peerType == NetworkPeerType.Disconnected){
	    _serverReady = false;
		// If server not connected
		// Creating server
		Network.InitializeServer(10, listenPort,useNAT);
		_numSwimSteps = _numWalkSteps = _playerNumber = 0;
        burnedCalories = 0;
		// Notify our objects that the level and the network is ready
		for (var go : GameObject in FindObjectsOfType(GameObject)){
			go.SendMessage("OnNetworkLoadedLevel", SendMessageOptions.DontRequireReceiver);
		}

	}
	else{
	   _serverReady = true;
	  // ipaddress = Network.player.ipAddress;
		//port = Network.player.port.ToString();
    }
	   
	if (isPlaying && !_goalReached && !_timerReached)
	{
	  if (_displayMinutes < gameTime){
	    burnedCalories =  (_numWalkSteps * 0.4445) + (_numSwimSteps * 1.15583174);
   //     Debug.Log("Current pos: " +_currentPos + " initial pos: " + _initialPos);
		meters = Vector2.Distance(_initialPos,_currentPos);

		elapsedTime =  Time.realtimeSinceStartup - _startTime;
	  }			
	}
	
	if(Input.GetKeyDown(KeyCode.H))  // Hide Polar Bear Info.
			GetComponent(InfoPolarBear).ShowInfo(false);
	else if(Input.GetKeyDown(KeyCode.S))
			GetComponent(InfoPolarBear).ShowInfo(true);	
			
	if(Input.touchCount > 0)
    {Debug.Log("Paso");
	     for (var touch: Touch in Input.touches)
	     {
	     Debug.Log("Entro");
	        for(var _prompt : GameObject in GameObject.FindObjectsOfType(GameObject))
			{
			    if(_prompt.name == "Prompt")
			    {
			        if(_prompt.HitTest(touch.position) && touch.phase == TouchPhase.Began)
			        {
			            Debug.Log("Red Button Clicked or EVEN BETTER AWESOME STUFF!");
			        } 
			    }
			}
	        
	     }
	}
}

function OnGUI () {
   
   if ( _serverReady){
		
	     DrawViews();
	     GetComponent(MessageBox).ShowOnGUI();
   }
	
	if (Event.current.type == EventType.Layout)
	{
		_innerController = 1;
	}
	
	if (Event.current.type == EventType.Repaint)
	{
		_innerController = 2;
	}
	
	if (_innerController == 2)
	{
		_showSummary = _showGraphView;
		_innerController = 0;
	}
	   
}

function DrawViews(){
	
  	GUI.skin = newSkin;
  	GUI.depth = 0;	
	    
	GUILayout.BeginArea(Rect(ScreenX,ScreenY, areaWidth, areaHeight));
  	GUI.DrawTexture (Rect (0, 0, areaWidth, areaHeight), backgroundTexture);
  		
  	if (!_showSummary)
  	{  // Draw the main view.

			GUILayout.BeginArea (Rect (areaWidth*0.3, areaHeight*0.18, areaWidth*0.4, _labelHeight));
			GUILayout.Label("Bear calories burned: " + (Mathf.Round(burnedCalories*100)/100) + " Calories");  
		    GUILayout.EndArea();
		    
			GUILayout.BeginArea (Rect (areaWidth*0.1, areaHeight*0.22, areaWidth*0.4, _labelHeight));
			//Disntance in meters
			//GUILayout.Label("Distance covered: "+ (Mathf.Round(meters*100)/100) + " meters");
			//Distance in feet
			GUILayout.Label("Distance covered: "+ (Mathf.Round(meters*3.2808*100)/100) + " Ft.");
			GUILayout.EndArea();
			
			if (isPlaying){
				_displaySeconds = Mathf.CeilToInt(elapsedTime)%60;
				_displayMinutes = Mathf.CeilToInt(elapsedTime)*0.01666667;
			}
			GUILayout.BeginArea (Rect (areaWidth*0.55, areaHeight*0.22, areaWidth*0.4, _labelHeight));
  		    GUILayout.Label("Elapsed time: "+ _displayMinutes.ToString("00") + " min "+ _displaySeconds.ToString("00") + " sec");
			GUILayout.EndArea ();
		    // Local and Remote View Panels
		    
		    GUILayout.BeginArea(Rect (areaWidth*0.08, areaHeight*0.3, areaWidth*0.4, areaHeight*0.4));
		    GUILayout.BeginVertical(GUI.skin.box, GUILayout.Height(areaHeight*0.4), GUILayout.Width(areaWidth*0.4));
		    GUILayout.Space(areaHeight*0.4);
		    GUILayout.EndVertical();
		    GUILayout.EndArea();
		    
		    GUILayout.BeginArea(Rect (areaWidth*0.52, areaHeight*0.3, areaWidth*0.4, areaHeight*0.4));
		    GUILayout.BeginVertical(GUI.skin.box, GUILayout.Height(areaHeight*0.4), GUILayout.Width(areaWidth*0.4));
		    GUILayout.Space(areaHeight*0.4);
		    GUILayout.EndVertical();
		    GUILayout.EndArea();
		    
		    if (_showMap && isPlaying){
				// Area containing the year slider and selection
				GUILayout.BeginArea (Rect (areaWidth*0.1, areaHeight*0.205, areaWidth*0.4, _labelHeight));
				GUILayout.Label("Bird's eye view");	
				GUILayout.EndArea();		
				// Area rendering the map and it's labels
				GUILayout.BeginArea (Rect (areaWidth*0.1,areaHeight*0.25,areaWidth*0.4,areaHeight*0.4));
				//GetComponent(CurrentPosInMap).SetCurrentYear(_currentYear);  --- Game Parameters
				GetComponent(CurrentPosInMap).DrawMap();
				GUILayout.EndArea();
			}
			if (_showCurrentGraph && isPlaying){
				GetComponent(BurnedCaloriesGraph).DrawCaloriesGraph();
			}
			
			//Hide until later
		    /*	GUILayout.BeginArea (Rect (areaWidth*0.8, areaHeight*0.85, areaWidth*0.15, _labelHeight));
		    if (GUILayout.Button("Show scores")){
			   
			 _showGraphView = true;
		     SendMessage("GetHistoricalAverageValues");
		     if (!_savedAvg && _goalReached){
		       		GetComponent(SummaryGraph).UpdateAverageValues();
		       		_savedAvg = true;
		     }
		     SendMessage("PrintSummaryGraph"); 
		     SendMessage("ShowSummaryGraph",true);  
		    }
		    GUILayout.EndArea();  
	      */
	      
			_scoresLoaded = false;
			if (!isPlaying){
	
				// Area rendering the UI elements 
				GUILayout.BeginArea (Rect (areaWidth*0.1, areaHeight*0.12, areaWidth*0.15, _labelHeight+areaHeight*0.01));
				_playerName = GUILayout.TextField(_playerName,12);
				GUILayout.EndArea();
		     	
		     	GUILayout.BeginArea (Rect (areaWidth*0.3, areaHeight*0.12, areaWidth*0.15, areaHeight*0.05));
			    if (GUILayout.Button(interpreterName)){
					
    				_showInterpreterList = !_showInterpreterList;
    			
   			    }
   			    GUILayout.EndArea();
   			    
   			    if (_showInterpreterList){

				 	for (var cnt:int  = 1; cnt < GetComponent(Interpreters).interpreterNames.Count; cnt++){
				 
				 	   GUILayout.BeginArea (Rect (areaWidth*0.3, areaHeight*0.12+_labelHeight*(cnt), areaWidth*0.15, _labelHeight));
				 	   if (GUILayout.Button((GetComponent(Interpreters).interpreterNames[cnt].ToString()))){
				 	   		interpreterName = GetComponent(Interpreters).interpreterNames[cnt];
				 	   		interpreterID = GetComponent(Interpreters).interpreterIDs[cnt];
				 	   		_showInterpreterList = !_showInterpreterList;
				 	   } 
				 	   GUILayout.EndArea();
				    }
			    }
			    
			    GUILayout.BeginArea (Rect (areaWidth*0.5, areaHeight*0.12, areaWidth*0.1, _labelHeight));
				if (GUILayout.Button("Settings")){	// Game Parameters
				     GetComponent(GameParameters).showGameParameters(true);
				}
				GUILayout.EndArea();
				 
				 
			}
			else{
		
				GUILayout.BeginArea (Rect (areaWidth*0.1, areaHeight*0.12, areaWidth*0.20, _labelHeight));
				GUILayout.Label("Player: " +_playerName);
				GUILayout.EndArea();
				
				GUILayout.BeginArea (Rect (areaWidth*0.3, areaHeight*0.12, areaWidth*0.15, areaHeight*0.05));
			    if (GUILayout.Button(interpreterName)){
					
    				_showInterpreterList = !_showInterpreterList;
    			
   			    }
   			    GUILayout.EndArea();
				if (_showInterpreterList){
	
					 	for (cnt  = 1; cnt < GetComponent(Interpreters).interpreterNames.Count; cnt++){
					 
					 	   GUILayout.BeginArea (Rect (areaWidth*0.3, areaHeight*0.12+_labelHeight*(cnt), areaWidth*0.15, _labelHeight));
					 	   if (GUILayout.Button((GetComponent(Interpreters).interpreterNames[cnt].ToString()))){
					 	   		interpreterName = GetComponent(Interpreters).interpreterNames[cnt];
					 	   		interpreterID = GetComponent(Interpreters).interpreterIDs[cnt];
					 	   		_showInterpreterList = !_showInterpreterList;
					 	   } 
					 	   GUILayout.EndArea();
					    }
				}
			   
				
		     	GUILayout.BeginArea (Rect (areaWidth*0.5, areaHeight*0.12, areaWidth*0.3, _labelHeight));				
				GUILayout.Label("Year: "+yearList[_currentYear].ToString() + " Goal time: " + gameDurationList[_durationGame]+" min");
				GUILayout.EndArea();
			
			}
			
				    
		  /*  GUILayout.BeginArea(Rect (areaWidth*0.1, areaHeight*0.95, areaWidth*0.3, _labelHeight));
		    _showInfo = GUILayout.Toggle(_showInfo, "Show polar bear info");
		    GetComponent(InfoPolarBear).ShowInfo(_showInfo);
		    GUILayout.EndArea();
		    */
		    // Game will stop by user request	
		    if (isPlaying){
		       GUILayout.BeginArea (Rect (areaWidth*0.8, areaHeight*0.12, areaWidth*0.15, _labelHeight));
		       if (_goalReached || _timerReached ){
		       		Debug.Log("Reached the max time");
			       if (GUILayout.Button("Play Again")){
					 isPlaying = false;  
					 GetComponent(InfoPolarBear).ShowInfo(false);
				     Initialize();    
				   }	   
		       }
		       else if (GUILayout.Button("Cancel Game")){
		         GetComponent(InfoPolarBear).ShowInfo(false);
				 isPlaying = false;  
				 GetComponent(AppendToLog).AppendDataToLog();
			     networkView.RPC ("StopGame", RPCMode.Others,burnedCalories); 
			     Initialize();    
			   }
			   GUILayout.EndArea();  
		
			}
			
	}
	else{  // Draw the Summary Graph
	
		GUILayout.BeginArea (Rect (areaWidth*0.1, areaHeight*0.2, areaWidth*0.45, _labelHeight));
		GUILayout.Label("Average Kcal Burned"); 
		GUILayout.EndArea();
		
		GUILayout.BeginArea (Rect (areaWidth*0.1, areaHeight*0.25, areaWidth*0.5, areaHeight*0.50));
		GUILayout.BeginVertical(GUI.skin.box, GUILayout.Height(areaHeight*0.5), GUILayout.Width(areaWidth*0.5));
		GUILayout.Space(areaHeight*0.5);
		GUILayout.EndVertical();
		GUILayout.EndArea();	
		
		//Return to main view button
		 GUILayout.BeginArea(Rect (areaWidth*0.8, areaHeight*0.85, areaWidth*0.15, _labelHeight));
	
		 if (GUILayout.Button("Back")){
		     SendMessage("ShowSummaryGraph",false);
		     _showGraphView = false;
		     GetComponent(BurnedCaloriesGraph).PrintBurnedCaloriesGraph();
		     GetComponent(CurrentPosInMap).PrintMap();
		     if (!isPlaying)
		     {
		        Initialize();  
		     }
	     }
	     GUILayout.EndArea ();
	     
	     
	
	    GUILayout.BeginArea (Rect (areaWidth*0.65, areaHeight*0.2, areaWidth*0.3, _labelHeight));
	  	GUILayout.Label("Top 10 - Year " + yearList[_currentYear]);  
	    GUILayout.EndArea();
	    
	    GUILayout.BeginArea (Rect (areaWidth*0.65, areaHeight*0.25, areaWidth*0.3, areaHeight*0.50));
	    GUILayout.BeginVertical(GUI.skin.box, GUILayout.Height(areaHeight*0.50), GUILayout.Width(areaWidth*0.3));

	    
	    for (var i:int = 0; i < 10 ; i++){
	       if (_scoresCount > 0 && i<_scoresCount){
	        var name : String = _scoreNames[i].ToString().Trim();
	        var min : int = Mathf.CeilToInt(float.Parse(_scoreValues[i]))*0.01666667;
	    	var sec : int = Mathf.CeilToInt(float.Parse(_scoreValues[i]))%60;
	    	GUILayout.Label( (i + 1).ToString().PadLeft(2) +". " + name.PadRight(13) + 
	    	min.ToString("00") + ":"+
	    	sec.ToString("00") + " min","ScoreStyle"); 
	    	}
	    	else
	    		GUILayout.Label("   " );
	    }
	    
	    GUILayout.EndVertical();
		GUILayout.EndArea();
		
		
  	}	
  	  	
  	//End Area for the entire GUI
  
	///  Game will stop when reach timer    
    if ((isPlaying && _displayMinutes == gameTime) || _goalReached ){
       Debug.Log("reachgoal");
       networkView.RPC ("FinishGame", RPCMode.Others,burnedCalories);  
       _timerReached = true; 
       if (!_savedLog){
       	Debug.Log("Saved Log");
 	    GetComponent(AppendToLog).AppendDataToLog();
 	    GetComponent(SummaryGraph).UpdateDataByYear();
 	    _savedLog = true;
       }
	}
	GetComponent(GameParameters).ShowOnGUI();
	GUILayout.EndArea();

	
}

function OnPlayerConnected(newPlayer: NetworkPlayer){
	
    //Called on the server only
     _playerNumber = int.Parse (newPlayer.ToString());
               
}

function LoadScores(){
	_scoreValues.Clear();
 	_scoreNames.Clear();
 	_scoresCount = 0;
 	
	_DBParameters = [yearList[_currentYear],TOP_SCORES];
    GetComponent(DatabaseConnection).GetScores(_DBParameters);
}

function SetScores(){

	_scoreValues.Clear();
 	_scoreNames.Clear();
 	_scoresCount = 0;
 	
    var topScoresEntries = topScores.Split('|'[0]);
	_scoresCount = topScoresEntries.length-1;

	for (var entry in topScoresEntries)
	{
	   var scoreData : String[]= entry.Split(':'[0]);
	   if (scoreData.Length > 1){
		   _scoreNames.Add(scoreData[ 0 ]);
		   _scoreValues.Add(scoreData[ 1 ]);
	   }
	}
	//Debug.Log("NetworkConnectionServer::Scores count"+_scoresCount);
}


public function playerName(){
    return _playerName;
}

public function reachedGoal(){
      return _goalReached;
}

public function timeElapsed(){
      return "00:"+_displayMinutes.ToString("00") + ":"+ _displaySeconds.ToString("00");
}

public function numberSteps(){
      return _numSwimSteps.ToString() +"|"+ _numWalkSteps.ToString();
}

public function swimSteps(){
	 return _numSwimSteps.ToString();
}

public function walkSteps(){
	return _numWalkSteps.ToString();
}
public function swimCalories(){
//_numSwimSteps
	return (_numSwimSteps* 1.15583174).ToString();
}
public function walkCalories(){
//_numWalkSteps
	return (_numWalkSteps * 0.4445).ToString();
}
public function currentYear(){

      return yearList[_currentYear];
}
@RPC
function ReceivedMovementInput (_steps: String ,  info : NetworkMessageInfo)
{
    //Called on the server only
    if (isPlaying){
	    //Called on the server
	    var values = _steps.Split(":"[0]);
	    if (values.length == 4 ){
		    
		    if (parseInt(values[0]) != _numWalkSteps){
		        _numWalkSteps = parseInt(values[0]);
		    }
		    if (parseInt(values[1]) != _numSwimSteps){
		        _numSwimSteps = parseInt(values[1]);
		    }
			GetComponent(CurrentPosInMap).UpdateCurrentPosition(_steps);
			_currentPos = new Vector2(0,parseFloat(values[3]));
	   }
   }
}
@RPC
function SendEventId (_id: int)
{
	 //Called on the server only
	Debug.Log("imagen actual: " + _id);	 
   GetComponent(InfoPolarBear).SetCurrentInfo(_id);
}

@RPC
function ReceivedFinishedLevel (_steps: String ,  info : NetworkMessageInfo)
{
	 //Called on the server only
    _goalReached = true;
    //Commented out for iPad demo
    
    if (!_savedLog){
	    GetComponent(AppendToLog).AppendDataToLog(); 	
	    GetComponent(SummaryGraph).UpdateDataByYear();
	    _savedLog = true;
    }
}

@RPC
function SetGoalBearInMap (_xyValues: String, info : NetworkMessageInfo)
{
	 //Called on the server only
     GetComponent(CurrentPosInMap).SetGoalBearInMap(_xyValues);
     
     var values = _xyValues.Split(":"[0]);
     var _x = parseFloat(values[2]);
     var _z = parseFloat(values[3]);
     _initialPos = new Vector2(0,_z);  
     _currentPos = new Vector2(0,_z);   
}

@RPC
function ShowInfoPolarBear (_value: int, info : NetworkMessageInfo)
{
	 //Called on the server only
     GetComponent(InfoPolarBear).SetCurrentInfo(_value);
     
}
@RPC
function SaveLogDocent (_level: String)
{
	 //Called on the Clients
}
@RPC
function LoadLevelInClient (_level: String)
{
	 //Called on the Clients
}
@RPC
function FinishGame (_calories: float ,  info : NetworkMessageInfo)
{
	 //Called on the Clients
}
@RPC
function StopGame (_calories: float ,  info : NetworkMessageInfo)
{
	 //Called on the Clients
}
