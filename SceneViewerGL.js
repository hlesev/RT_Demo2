var SceneViewerGL = (function () {
   
    function SceneViewerGL(_viewportID) 
	{
		this.showWireframe = false;
		
        this.viewportID = _viewportID;
		
		this.SCENE_SCALE = 5;
		
		this.container = document.getElementById( this.viewportID );
		var rendererWidth = this.container.offsetWidth;
		var rendererHight = this.container.offsetHeight;
				
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 45, rendererWidth/rendererHight, 0.1, 5000 );
	
		this.controls = new THREE.OrbitControls( this.camera, this.container );
		
		var renderThis = this.render.bind(this);
		this.controls.addEventListener( 'change', renderThis );

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.autoClearDepth = false;
		this.renderer.setSize( rendererWidth, rendererHight );
				
		this.container.appendChild( this.renderer.domElement );
				
		this.renderer.gammaInput = true;
		this.renderer.gammaOutput = true;

		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.cullFace = THREE.CullFaceBack;
		
		this.renderer.setClearColor(0xEEEEEE);
		
		var autoResizeThis = this.autoResize.bind(this);
		$(this.container).resize(autoResizeThis);
		
		var light = new THREE.DirectionalLight(0xffffff, 0.55);
		light.position.set(0, 0, 1);
		this.scene.add(light);
		
		this.sceneGeometry = [];
		this.sceneEdges = [];
		this.sceneObjects = [];
		
		this.camera.position.z = 3;
		
		hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
		hemiLight.color.setHSL( 0.6, 1, 0.6 );
		hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
		hemiLight.position.set( 0, 500, 0 );
		this.scene.add( hemiLight );

		this.render();
    }
	
	SceneViewerGL.prototype.render = function () {
		this.renderer.render( this.scene, this.camera );
	};
	
	SceneViewerGL.prototype.autoResize = function() {
		var width = $(this.container).width();
		var height = $(this.container).height();
		
		$(this.renderer.domElement).css({
			width : width,
			height : height
		});
		
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		
		this.renderer.setSize(width, height);
		
		this.render();
	};
	
	SceneViewerGL.prototype.toggleShowWireframe = function() {
		this.showWireframe = !this.showWireframe;
		this.objSceneEdges.visible = this.showWireframe;
		
		this.render();
		console.log( this.showWireframe );
	}
	
	SceneViewerGL.prototype.parseSceneFile = function( sceneURL )
	{
		function escapeRegExp(string) {
			return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
		}

		function replaceAll(find, replace, str) {
			return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
		}
		
		var that = this;
		jQuery.get(sceneURL, function(data) 
		{	
			var lines = data.split('\n');
			
			var WHITESPACE_RE = /\s+/;
			
			var length = lines.length;
			
			var vertsID = 0;
			var matID = 0;
			
			var geom = new THREE.Geometry(); 
			//var objSceneEdges;
			var mats = []; 
			
			for(var i = 0; i < length; i++)
			{
				var line = lines[i].trim();
				
				line = replaceAll('(','', line);
				line = replaceAll(')','', line);
				
				
				var elements = line.split(WHITESPACE_RE);
				
				var elID = 0;

				if( 't'==elements[0] )
				{
					elements.shift();
					
					var v1 = new THREE.Vector3(elements[elID++],elements[elID++],elements[elID++]);
					var v2 = new THREE.Vector3(elements[elID++],elements[elID++],elements[elID++]);
					var v3 = new THREE.Vector3(elements[elID++],elements[elID++],elements[elID++]);
					
					v1.multiplyScalar( that.SCENE_SCALE );
					v2.multiplyScalar( that.SCENE_SCALE );
					v3.multiplyScalar( that.SCENE_SCALE );

					geom.vertices.push(v1);
					geom.vertices.push(v2);
					geom.vertices.push(v3);
					
					geom.faces.push( new THREE.Face3( vertsID++, vertsID++, vertsID++, null, null, matID-1 ) );

				}
				else if( 'm'==elements[0] )
				{
					elements.shift();
	
					var matType = elements[elID++];
					
					if( 'diff' == matType )
					{
						var rgbDiff = Math.floor(elements[elID++] * 255);
						rgbDiff = (rgbDiff << 8) + Math.floor(elements[elID++] * 255);
						rgbDiff = (rgbDiff << 8) + Math.floor(elements[elID++] * 255);

						matID = mats.push( new THREE.MeshLambertMaterial( {color:rgbDiff, /*emissive:rgbEmiss,*/ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 } ) )

						//currentMaterial = new MatDiffuse( new Color3(elements[elID++], elements[elID++], elements[elID++]) );
					}
					else
					{
						//currentMaterial = new MatDiffuse( new Color3(1, 1, 1) );
					}
					
				}
			}
			
			var material = new THREE.MeshFaceMaterial( mats );
			var meshObject = new THREE.Mesh( geom, material );
			that.scene.add( meshObject );
			
			that.objSceneEdges = new THREE.EdgesHelper( meshObject, 0x00ff00 );
			that.objSceneEdges.visible = false;
			that.scene.add( that.objSceneEdges );
			
			that.render();
		});
	}
	
	SceneViewerGL.prototype.debugPixel = function(x, y)
	{
		var dbgData = {
				"regionX":0, "regionW":500,
				"regionY":0, "regionH":500,
				"screenW":500, 
				"screenH":500,
				"debugX":x,
				"debugY":y,			
				"tracingMode": "debug",
				"sceneURI" : "scenes/cornellbox-e.ml.txt"
			};
			
		var worker = new Worker("js/Raytracer.js");
		
		var that = this;
			
		var onWorkerMessage = function(e) 
		{
			switch (e.data[0]) {
				case 'debugRes':
					console.log( e.data[1] );
					worker.terminate();
					
					var rayGeometry = new THREE.Geometry();
						for( var i=0; i<e.data[1].length; )
						{
							rayGeometry.vertices.push(new THREE.Vector3(
								e.data[1][i++] * that.SCENE_SCALE, 
								e.data[1][i++] * that.SCENE_SCALE,
								e.data[1][i++] * that.SCENE_SCALE
								));
								
							i+=3;
						}
						
						var rayMaterial = new THREE.LineBasicMaterial({
        												color: 0x0000ff
    													});
														
						var rayPath = new THREE.Line(rayGeometry, rayMaterial);
						
						that.scene.add(rayPath);
						
						that.render();
					
					break;
			}
        };	

		worker.onmessage = onWorkerMessage;
		worker.postMessage([JSON.stringify(dbgData), null]);
	}
	
    return SceneViewerGL;
})();
