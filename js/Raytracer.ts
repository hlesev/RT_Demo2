/*
Copyright (C) 2015 Hristo Lesev 
*/

class Vector3
{
	public x : number;
	public y : number;
	public z : number;
	
	constructor( _x: number, _y:number, _z:number )
	{
		this.x = _x;
		this.y = _y;
		this.z = _z;
	}
	
	static mul( _s : number, _v : Vector3 )
	{
		return new Vector3( _s * _v.x, _s * _v.y, _s * _v.z);
	}
	
	static minus( _v1:Vector3, _v2:Vector3 )
	{
		return new Vector3( _v1.x - _v2.x, _v1.y - _v2.y, _v1.z - _v2.z );
	}
	
	static plus( _v1:Vector3, _v2:Vector3 )
	{
		return new Vector3( _v1.x + _v2.x, _v1.y + _v2.y, _v1.z + _v2.z );
	}
	
	static dot( _v1:Vector3, _v2:Vector3 )
	{
		return _v1.x * _v2.x + _v1.y * _v2.y + _v1.z * _v2.z;
	}
	
	static cross( _v1:Vector3, _v2:Vector3 )
	{
		return new Vector3(_v1.y * _v2.z - _v1.z * _v2.y,
                           _v1.z * _v2.x - _v1.x * _v2.z,
                           _v1.x * _v2.y - _v1.y * _v2.x);
	}
	
	static getLength( _v : Vector3 )
	{
		return Math.sqrt(_v.x * _v.x + _v.y * _v.y + _v.z * _v.z);
	}
	
	static getLengthSqr( _v : Vector3 ) : number
	{
		return (_v.x * _v.x + _v.y * _v.y + _v.z * _v.z);
	}
	
	static getNormalized( _v : Vector3 )
	{
		var len = Vector3.getLength(_v);
		var oneOverLen = (len === 0) ? Infinity : 1.0 / len;
		
		return Vector3.mul( oneOverLen, _v );
	}
}

class Color3
{
	public r : number;
	public g : number;
	public b : number;
	
	constructor( _r: number, _g:number, _b:number )
	{
		this.r = _r;
		this.g = _g;
		this.b = _b;
	}
	
	static getCanvasColor( _c: Color3 ) {
        var clampToOne = x => x > 1 ? 1 : x;
        return {
            r: Math.floor(clampToOne(_c.r) * 255),
            g: Math.floor(clampToOne(_c.g) * 255),
            b: Math.floor(clampToOne(_c.b) * 255)
        }
    }
	
	static mul( _c1 : Color3, _c2 : Color3 ) : Color3
	{
		return new Color3( _c1.r * _c2.r, _c1.g * _c2.g, _c1.b * _c2.b);
	}
	
	static muls( _s : number, _c2 : Color3 ) : Color3
	{
		return new Color3( _s * _c2.r, _s * _c2.g, _s * _c2.b);
	}
	
	static add( _c1 : Color3, _c2 : Color3 ) : Color3
	{
		return new Color3( _c1.r + _c2.r, _c1.g + _c2.g, _c1.b + _c2.b);
	}
}

class Ray
{
	public origin : Vector3;
	public dir : Vector3;
	
	public minT : number = 0.0000001;
	public maxT : number = 1000000.0;
	
	public static raysGenerated = 0;
	
	constructor( _origin : Vector3, _dir : Vector3 )
	{
		this.origin = _origin;
		this.dir = _dir;
		
		Ray.raysGenerated++;
	}
}

class Camera
{
	public forward : Vector3;
	public right : Vector3;
	public up : Vector3;
	
	public pos : Vector3;
	
	public nearT: number;
	public farT: number;
	
	constructor( _pos : Vector3, _dir : Vector3, _nearT: number, _farT: number )
	{
		this.pos = _pos;
		
		this.farT = _farT;
		this.nearT = _nearT;
		
		var down = new Vector3(0.0, -1.0, 0.0);
        this.forward = Vector3.getNormalized( _dir );
        this.right = Vector3.mul(1.5, Vector3.getNormalized(Vector3.cross(this.forward, down)));
        this.up = Vector3.mul(1.5, Vector3.getNormalized(Vector3.cross(this.forward, this.right)));
	}
	
	public getRay( _pixX:number, _pixY:number, _screenWidth:number, _screenHeight:number )
	{
		var x = ((_screenWidth * 0.5 )-_pixX) * 0.5 / _screenWidth;
        var y = - (_pixY - (_screenHeight * 0.5)) * 0.5 / _screenHeight;
        var dir : Vector3 = Vector3.plus(this.forward, 
										Vector3.plus(Vector3.mul(x, this.right), 
										Vector3.mul(y, this.up)));

		var ray = new Ray( this.pos, Vector3.getNormalized(dir) );
		ray.minT = this.nearT;
		ray.maxT = this.farT;
		
		return ray;
	}
}

interface Material
{
	filterColor: Color3;
	getColor: () => Color3;
}

class MatDiffuse implements Material
{
	public filterColor: Color3;
	
	constructor( _filterColor : Color3 )
	{
		this.filterColor = _filterColor;
	}
	
	getColor()
	{
		return this.filterColor;
	}
}

class MatEmitter implements Material
{
	public filterColor: Color3;
	
	constructor( _filterColor : Color3 )
	{
		this.filterColor = _filterColor;
	}
	
	getColor()
	{
		return this.filterColor;
	}
}

interface Geometry
{
	intersect: ( _ray: Ray ) => number;
	getMaterial: () => Material;
	getNormal: () => Vector3;
}

class Triangle implements Geometry
{
	private material: Material;
	
	private v0:Vector3;
	private edge1:Vector3;
	private edge2:Vector3;
	private normal:Vector3;
	
	constructor( _v0:Vector3, _v1:Vector3, _v2:Vector3, _material: Material )
	{	
		this.v0 = _v0;
		
		this.edge1 = Vector3.minus( _v1, _v0 );
		this.edge2 = Vector3.minus( _v2, _v0 );
		
		this.normal = Vector3.getNormalized(Vector3.cross( this.edge1, this.edge2 ));
		
		this.material = _material;
	}
	
	getMaterial(  ) : Material
	{
		return this.material;
	}
	
	getNormal() : Vector3
	{
		return this.normal;
	}
	
	intersect( _ray : Ray ) : number
	{
   		var pvec : Vector3 = Vector3.cross( _ray.dir, this.edge2 );
   		var det : number = Vector3.dot( this.edge1, pvec );
   		var hitDist : number = 0;
   
		if( (det <= -MathUtils.EPSILON) || (det >= MathUtils.EPSILON) )
		{
			var inv_det : number = 1.0 / det;
			var tvec : Vector3 = Vector3.minus( _ray.origin, this.v0 );
			var u : number = Vector3.dot( tvec, pvec ) * inv_det;
			
			if( (u >= 0.0) && (u <= 1.0) )
			{
				var qvec : Vector3 = Vector3.cross( tvec, this.edge1 );
				var v : number = Vector3.dot( _ray.dir, qvec ) * inv_det;
				if( (v >= 0.0) && (u + v <= 1.0) )
				{
					hitDist = Vector3.dot( this.edge2, qvec ) * inv_det;

					if( hitDist < 0 )
						hitDist = 0;
				}
			}
		}

		return hitDist;
	}
}

class Sphere implements Geometry
{
	public center : Vector3;
	public radius : number;
	
	private radius2 : number;
	
	private material: Material;
		
	constructor( _center : Vector3, _radius : number, _material: Material)
	{
		this.center = _center;
		this.radius = _radius;
		this.radius2 = _radius * _radius;
		
		this.material = _material;
	}
	
	getMaterial(  ) : Material
	{
		return this.material;
	}
	
	getNormal() : Vector3
	{
		return new Vector3(0, 0, 1);
	}
	
	intersect( _ray : Ray ) : number
	{
		var eo = Vector3.minus(this.center, _ray.origin);
        var v = Vector3.dot(eo, _ray.dir);
        var dist = 0;
        if (v >= 0) {
            var disc = this.radius2 - (Vector3.dot(eo, eo) - v * v);
            if (disc >= 0) {
                dist = v - Math.sqrt(disc);
            }
        }
		
		return dist;
	}
}

class Scene
{
	public geometry : Array<Geometry> = [];
	public camera 	: Camera;
	
	intersect( _ray : Ray ) : Geometry
	{
		var t:number = 1e20;
		
		var hitGeom: Geometry = null;
		
		for( var gID:number = 0; gID < this.geometry.length; ++gID )
		{
			var dist : number = this.geometry[gID].intersect( _ray );
			
			if( dist < _ray.minT )
				continue;
			
			if( (0 < dist) && (dist < t) )
			{
				t = dist;
				hitGeom = this.geometry[gID];
				_ray.maxT = t;
			}
		}
		
		return hitGeom;
	}
}

class MathUtils
{
	public static EPSILON : number = 1.0 / 1048576.0;
	
	public static getPointWC( _pos : Vector3, _dir : Vector3, _t : number ) : Vector3
	{
		return Vector3.plus( _pos, Vector3.mul(_t, _dir) );
	}
	
	public static applyTangentFrame( _normal : Vector3, _zDir : Vector3) : Vector3
	{ 
		var tangent : Vector3;
	
		tangent = Vector3.cross(_normal, new Vector3(0.643782, 0.98432, 0.324632));

		if (Vector3.getLengthSqr(tangent) < 0.00001)
			tangent = Vector3.cross(_normal, new Vector3(0.432902, 0.43223, 0.908953));

		tangent = Vector3.getNormalized(tangent);
		
		var biTangent : Vector3 = Vector3.cross( _normal, tangent);
		/*
		var a : Vector3 = Vector3.mul( _zDir.x, tangent);
		var b : Vector3 = Vector3.mul( _zDir.y, biTangent);
		var c : Vector3 = Vector3.mul( _zDir.z, _normal );
*/
		var outDirection : Vector3 = Vector3.plus( 
			Vector3.mul( _zDir.x, tangent ), 
			Vector3.plus(
				Vector3.cross( _normal, Vector3.mul( _zDir.y, tangent ) ),
         		Vector3.mul( _zDir.z, _normal ))
		);
		
		
		return Vector3.getNormalized(outDirection);
	}
	
	public static getDiffDirLocal() : Vector3
	{
		var _2pr1 : number = Math.PI * 2.0 * Math.random();
		var sr1 : number = Math.random();
		var sr2 : number   = Math.sqrt( sr1 );
		  
		return new Vector3(
			Math.cos( _2pr1 ) * sr2,
			Math.sin( _2pr1 ) * sr2,
			Math.sqrt( 1.0 - (sr1) )
		);
	}
}

class RendererData
{
	public sceneURI : string;
	public tracingMode : string;
	
	public regionX : number;
	public regionY : number;
	public regionW : number;
	public regionH : number;
	
	public screenW : number;
	public screenH : number;
	
	public debugX : number;
	public debugY : number;
	
	public fillFromJSON(_json: string) {
        var jsonObj = JSON.parse(_json);
        for (var propName in jsonObj) {
            this[propName] = jsonObj[propName]
        }
    }
}

class RayTracer
{
	public scene : Scene;
	public imgData : ImageData;
	public rendererData : RendererData;
	
	private isDebugging : boolean = false;
	private debugLightPath : Array<number>;
	
	constructor( )
	{
	}
	
	public getRadiance( _ray : Ray, _depth:number ) : Color3
	{
		var radiance = new Color3( 0, 0, 0 );
		
		if( this.isDebugging )
		{
			this.debugLightPath.push( 
				_ray.origin.x,
				_ray.origin.y,
				_ray.origin.z,
				
				_ray.dir.x,
				_ray.dir.y,
				_ray.dir.z
			  );
		}
		
		if( _depth > 10 )
			return radiance;
			
		var hitGeometry: Geometry = this.scene.intersect(_ray);
		
		if( null != hitGeometry )
		{
			var objColor = hitGeometry.getMaterial().getColor();
			
			var normal = hitGeometry.getNormal();
			var nextDir = MathUtils.getDiffDirLocal();
			nextDir = MathUtils.applyTangentFrame(normal, nextDir);

			var nextRay = new Ray( 
				MathUtils.getPointWC(_ray.origin, _ray.dir, _ray.maxT), 
				nextDir
				);
				
			nextRay.minT = 0.0001;
				
			var inRad : Color3 = this.getRadiance(nextRay, ++_depth);
			inRad = Color3.muls( Math.PI, inRad );

			inRad = Color3.muls( Math.abs(Vector3.dot(_ray.dir, normal)), inRad );

			radiance = Color3.add(
				radiance,
				Color3.mul(objColor, inRad )
				);
				
		}
		else
		{
			radiance = new Color3(1, 1, 1);
		}
		
		return radiance;
	}
	
	public render( )
	{
		if( 'debug' == this.rendererData.tracingMode )
			this.traceDebug();
		else
			this.trace();
	}
		
	private traceDebug( )
	{
		console.log( "Debug mode ON: " + this.scene.geometry.length );
		
		var pixX : number = this.rendererData.debugX + this.rendererData.regionX;
		var pixY : number = this.rendererData.debugY + this.rendererData.regionY;
		
		this.isDebugging = true;
		this.debugLightPath = new Array<number>();
		
		var ray = this.scene.camera.getRay( pixX, pixY, this.rendererData.screenW, this.rendererData.screenH );
		this.getRadiance( ray, 1 );
		
		postMessage(['debugRes', this.debugLightPath]);
		close();
	}
		
	private trace( )
	{
		
		console.log( "Scene objects: " + this.scene.geometry.length );

		var maxIterations : number = 5;
		for( var iterations = 0; iterations < maxIterations; ++iterations )
		{
			for( var y = 0; y < this.rendererData.regionH; y++ )
			{
				for( var x = 0; x < this.rendererData.regionW; x++ )
				{
					
					var pixX : number = x + this.rendererData.regionX + Math.random();
					var pixY : number = y + this.rendererData.regionY + Math.random();
					
					var pixID : number = (x*4) + (y*this.rendererData.regionW*4);
					
					var ray = this.scene.camera.getRay( pixX, pixY, this.rendererData.screenW, this.rendererData.screenH );
					
					var c = Color3.getCanvasColor( this.getRadiance( ray, 1 ) );
	
					this.imgData.data[pixID++] += c.r / maxIterations;
					this.imgData.data[pixID++] += c.g / maxIterations;
					this.imgData.data[pixID++] += c.b / maxIterations;
					this.imgData.data[pixID++]  = 255;
					
				}
				
				postMessage(['calculating', y ]);
				
				postMessage(['result', this.imgData, JSON.stringify(this.rendererData)]);
			}
		}
		
		console.log('Posting message back to main script');
  		postMessage(['result', this.imgData, JSON.stringify(this.rendererData)]);

        postMessage(['finished', JSON.stringify(this.rendererData)]);	
		close();
	}
}


class SceneParser
{
	private static scene : Scene;
	private static tracer : RayTracer;
	
	public static parseSceneFile( _fileURL : string, _scene : Scene, _tracer : RayTracer ) : void
	{
		SceneParser.scene = _scene;
		SceneParser.tracer = _tracer;
		
		var xhttp = new XMLHttpRequest();
		
  		xhttp.onreadystatechange = function() 
		  {
			if (xhttp.readyState == 4 && xhttp.status == 200) 
			{
				SceneParser.parseSceneFileInternal( xhttp.responseText );
			}
  		}
		  
		xhttp.open("GET", _fileURL, true);
		xhttp.send();
	}
	
	private static escapeRegExp(_str:string) : string
	{
		return _str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	}
	
	private static replaceAll(_find:string, _replace:string, _str:string) : string
	{
		return _str.replace(new RegExp(SceneParser.escapeRegExp(_find), 'g'), _replace);
	}
	
	private static parseSceneFileInternal( _data ) : void
	{	
		var lines = _data.split('\n');
		
		var WHITESPACE_RE = /\s+/;
		
		var SCENE_SCALE = 5;
		
		var length = lines.length;
		
		var vertsID = 0;
		var matID = 0;
		var elID = 0;
		
		var currentMaterial : 	Material;
		
		for(var i = 0; i < length; i++)
		{
			var line = lines[i].trim();
			
			line = SceneParser.replaceAll('(','', line);
			line = SceneParser.replaceAll(')','', line);
			
			
			var elements = line.split(WHITESPACE_RE);
			//elements.shift();
			
			elID = 0;
			
			if( 'c'==elements[0] )
			{
				elements.shift();

				console.log( elements );
				
				var pos = new Vector3(+elements[elID++],+elements[elID++],+elements[elID++]);
				var dir = new Vector3(+elements[elID++],+elements[elID++],+elements[elID++]);
				
				SceneParser.scene.camera = new Camera(pos, dir, 0, 1000000.0);
			}
			else if( 'm'==elements[0] )
			{
				elements.shift();

				var matType = elements[elID++];
				
				if( 'diff' == matType )
				{
					currentMaterial = new MatDiffuse( new Color3(elements[elID++], elements[elID++], elements[elID++]) );
				}
				else
				{
					currentMaterial = new MatDiffuse( new Color3(1, 1, 1) );
				}
				
			}
			else if( 't'==elements[0] )
			{
				elements.shift();
				
				var v0 = new Vector3(elements[elID++],elements[elID++],elements[elID++]);
				var v1 = new Vector3(elements[elID++],elements[elID++],elements[elID++]);
				var v2 = new Vector3(elements[elID++],elements[elID++],elements[elID++]);
						
				SceneParser.scene.geometry.push( new Triangle(v0, v1, v2, currentMaterial) );
			}

		}
		SceneParser.tracer.render();
	}
	
}

function runApp( _renderDataJSON : any , _imgData : any  )
{
	var scene : Scene = new Scene();
	var tracer = new RayTracer();
	
	var renderData : RendererData = new RendererData();
	renderData.fillFromJSON( _renderDataJSON );

	tracer.scene = scene;
	tracer.imgData = _imgData;
	tracer.rendererData = renderData;

	SceneParser.parseSceneFile( renderData.sceneURI , scene, tracer );
}

declare function postMessage( msg : any );

onmessage = function(e) {
  console.log('Message received from main script');
  
  runApp(e.data[0], e.data[1]);
}
