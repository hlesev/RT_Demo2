/*
Copyright (C) 2015 Hristo Lesev
*/
var Vector3 = (function () {
    function Vector3(_x, _y, _z) {
        this.x = _x;
        this.y = _y;
        this.z = _z;
    }
    Vector3.mul = function (_s, _v) {
        return new Vector3(_s * _v.x, _s * _v.y, _s * _v.z);
    };
    Vector3.minus = function (_v1, _v2) {
        return new Vector3(_v1.x - _v2.x, _v1.y - _v2.y, _v1.z - _v2.z);
    };
    Vector3.plus = function (_v1, _v2) {
        return new Vector3(_v1.x + _v2.x, _v1.y + _v2.y, _v1.z + _v2.z);
    };
    Vector3.dot = function (_v1, _v2) {
        return _v1.x * _v2.x + _v1.y * _v2.y + _v1.z * _v2.z;
    };
    Vector3.cross = function (_v1, _v2) {
        return new Vector3(_v1.y * _v2.z - _v1.z * _v2.y, _v1.z * _v2.x - _v1.x * _v2.z, _v1.x * _v2.y - _v1.y * _v2.x);
    };
    Vector3.getLength = function (_v) {
        return Math.sqrt(_v.x * _v.x + _v.y * _v.y + _v.z * _v.z);
    };
    Vector3.getLengthSqr = function (_v) {
        return (_v.x * _v.x + _v.y * _v.y + _v.z * _v.z);
    };
    Vector3.getNormalized = function (_v) {
        var len = Vector3.getLength(_v);
        var oneOverLen = (len === 0) ? Infinity : 1.0 / len;
        return Vector3.mul(oneOverLen, _v);
    };
    return Vector3;
})();
var Color3 = (function () {
    function Color3(_r, _g, _b) {
        this.r = _r;
        this.g = _g;
        this.b = _b;
    }
    Color3.getCanvasColor = function (_c) {
        var clampToOne = function (x) { return x > 1 ? 1 : x; };
        return {
            r: Math.floor(clampToOne(_c.r) * 255),
            g: Math.floor(clampToOne(_c.g) * 255),
            b: Math.floor(clampToOne(_c.b) * 255)
        };
    };
    Color3.mul = function (_c1, _c2) {
        return new Color3(_c1.r * _c2.r, _c1.g * _c2.g, _c1.b * _c2.b);
    };
    Color3.muls = function (_s, _c2) {
        return new Color3(_s * _c2.r, _s * _c2.g, _s * _c2.b);
    };
    Color3.add = function (_c1, _c2) {
        return new Color3(_c1.r + _c2.r, _c1.g + _c2.g, _c1.b + _c2.b);
    };
    return Color3;
})();
var Ray = (function () {
    function Ray(_origin, _dir) {
        this.minT = 0.0000001;
        this.maxT = 1000000.0;
        this.origin = _origin;
        this.dir = _dir;
        Ray.raysGenerated++;
    }
    Ray.raysGenerated = 0;
    return Ray;
})();
var Camera = (function () {
    function Camera(_pos, _dir, _nearT, _farT) {
        this.pos = _pos;
        this.farT = _farT;
        this.nearT = _nearT;
        var down = new Vector3(0.0, -1.0, 0.0);
        this.forward = Vector3.getNormalized(_dir);
        this.right = Vector3.mul(1.5, Vector3.getNormalized(Vector3.cross(this.forward, down)));
        this.up = Vector3.mul(1.5, Vector3.getNormalized(Vector3.cross(this.forward, this.right)));
    }
    Camera.prototype.getRay = function (_pixX, _pixY, _screenWidth, _screenHeight) {
        var x = ((_screenWidth * 0.5) - _pixX) * 0.5 / _screenWidth;
        var y = -(_pixY - (_screenHeight * 0.5)) * 0.5 / _screenHeight;
        var dir = Vector3.plus(this.forward, Vector3.plus(Vector3.mul(x, this.right), Vector3.mul(y, this.up)));
        var ray = new Ray(this.pos, Vector3.getNormalized(dir));
        ray.minT = this.nearT;
        ray.maxT = this.farT;
        return ray;
    };
    return Camera;
})();
var MatDiffuse = (function () {
    function MatDiffuse(_filterColor) {
        this.filterColor = _filterColor;
    }
    MatDiffuse.prototype.getColor = function () {
        return this.filterColor;
    };
    return MatDiffuse;
})();
var MatEmitter = (function () {
    function MatEmitter(_filterColor) {
        this.filterColor = _filterColor;
    }
    MatEmitter.prototype.getColor = function () {
        return this.filterColor;
    };
    return MatEmitter;
})();
var Triangle = (function () {
    function Triangle(_v0, _v1, _v2, _material) {
        this.v0 = _v0;
        this.edge1 = Vector3.minus(_v1, _v0);
        this.edge2 = Vector3.minus(_v2, _v0);
        this.normal = Vector3.getNormalized(Vector3.cross(this.edge1, this.edge2));
        this.material = _material;
    }
    Triangle.prototype.getMaterial = function () {
        return this.material;
    };
    Triangle.prototype.getNormal = function () {
        return this.normal;
    };
    Triangle.prototype.intersect = function (_ray) {
        var pvec = Vector3.cross(_ray.dir, this.edge2);
        var det = Vector3.dot(this.edge1, pvec);
        var hitDist = 0;
        if ((det <= -MathUtils.EPSILON) || (det >= MathUtils.EPSILON)) {
            var inv_det = 1.0 / det;
            var tvec = Vector3.minus(_ray.origin, this.v0);
            var u = Vector3.dot(tvec, pvec) * inv_det;
            if ((u >= 0.0) && (u <= 1.0)) {
                var qvec = Vector3.cross(tvec, this.edge1);
                var v = Vector3.dot(_ray.dir, qvec) * inv_det;
                if ((v >= 0.0) && (u + v <= 1.0)) {
                    hitDist = Vector3.dot(this.edge2, qvec) * inv_det;
                    if (hitDist < 0)
                        hitDist = 0;
                }
            }
        }
        return hitDist;
    };
    return Triangle;
})();
var Sphere = (function () {
    function Sphere(_center, _radius, _material) {
        this.center = _center;
        this.radius = _radius;
        this.radius2 = _radius * _radius;
        this.material = _material;
    }
    Sphere.prototype.getMaterial = function () {
        return this.material;
    };
    Sphere.prototype.getNormal = function () {
        return new Vector3(0, 0, 1);
    };
    Sphere.prototype.intersect = function (_ray) {
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
    };
    return Sphere;
})();
var Scene = (function () {
    function Scene() {
        this.geometry = [];
    }
    Scene.prototype.intersect = function (_ray) {
        var t = 1e20;
        var hitGeom = null;
        for (var gID = 0; gID < this.geometry.length; ++gID) {
            var dist = this.geometry[gID].intersect(_ray);
            if (dist < _ray.minT)
                continue;
            if ((0 < dist) && (dist < t)) {
                t = dist;
                hitGeom = this.geometry[gID];
                _ray.maxT = t;
            }
        }
        return hitGeom;
    };
    return Scene;
})();
var MathUtils = (function () {
    function MathUtils() {
    }
    MathUtils.getPointWC = function (_pos, _dir, _t) {
        return Vector3.plus(_pos, Vector3.mul(_t, _dir));
    };
    MathUtils.applyTangentFrame = function (_normal, _zDir) {
        var tangent;
        tangent = Vector3.cross(_normal, new Vector3(0.643782, 0.98432, 0.324632));
        if (Vector3.getLengthSqr(tangent) < 0.00001)
            tangent = Vector3.cross(_normal, new Vector3(0.432902, 0.43223, 0.908953));
        tangent = Vector3.getNormalized(tangent);
        var biTangent = Vector3.cross(_normal, tangent);
        /*
        var a : Vector3 = Vector3.mul( _zDir.x, tangent);
        var b : Vector3 = Vector3.mul( _zDir.y, biTangent);
        var c : Vector3 = Vector3.mul( _zDir.z, _normal );
*/
        var outDirection = Vector3.plus(Vector3.mul(_zDir.x, tangent), Vector3.plus(Vector3.cross(_normal, Vector3.mul(_zDir.y, tangent)), Vector3.mul(_zDir.z, _normal)));
        return Vector3.getNormalized(outDirection);
    };
    MathUtils.getDiffDirLocal = function () {
        var _2pr1 = Math.PI * 2.0 * Math.random();
        var sr1 = Math.random();
        var sr2 = Math.sqrt(sr1);
        return new Vector3(Math.cos(_2pr1) * sr2, Math.sin(_2pr1) * sr2, Math.sqrt(1.0 - (sr1)));
    };
    MathUtils.EPSILON = 1.0 / 1048576.0;
    return MathUtils;
})();
var RendererData = (function () {
    function RendererData() {
    }
    RendererData.prototype.fillFromJSON = function (_json) {
        var jsonObj = JSON.parse(_json);
        for (var propName in jsonObj) {
            this[propName] = jsonObj[propName];
        }
    };
    return RendererData;
})();
var RayTracer = (function () {
    function RayTracer() {
        this.isDebugging = false;
    }
    RayTracer.prototype.getRadiance = function (_ray, _depth) {
        var radiance = new Color3(0, 0, 0);
        if (this.isDebugging) {
            this.debugLightPath.push(_ray.origin.x, _ray.origin.y, _ray.origin.z, _ray.dir.x, _ray.dir.y, _ray.dir.z);
        }
        if (_depth > 10)
            return radiance;
        var hitGeometry = this.scene.intersect(_ray);
        if (null != hitGeometry) {
            var objColor = hitGeometry.getMaterial().getColor();
            var normal = hitGeometry.getNormal();
            var nextDir = MathUtils.getDiffDirLocal();
            nextDir = MathUtils.applyTangentFrame(normal, nextDir);
            var nextRay = new Ray(MathUtils.getPointWC(_ray.origin, _ray.dir, _ray.maxT), nextDir);
            nextRay.minT = 0.0001;
            var inRad = this.getRadiance(nextRay, ++_depth);
            inRad = Color3.muls(Math.PI, inRad);
            inRad = Color3.muls(Math.abs(Vector3.dot(_ray.dir, normal)), inRad);
            radiance = Color3.add(radiance, Color3.mul(objColor, inRad));
        }
        else {
            radiance = new Color3(1, 1, 1);
        }
        return radiance;
    };
    RayTracer.prototype.render = function () {
        if ('debug' == this.rendererData.tracingMode)
            this.traceDebug();
        else
            this.trace();
    };
    RayTracer.prototype.traceDebug = function () {
        console.log("Debug mode ON: " + this.scene.geometry.length);
        var pixX = this.rendererData.debugX + this.rendererData.regionX;
        var pixY = this.rendererData.debugY + this.rendererData.regionY;
        this.isDebugging = true;
        this.debugLightPath = new Array();
        var ray = this.scene.camera.getRay(pixX, pixY, this.rendererData.screenW, this.rendererData.screenH);
        this.getRadiance(ray, 1);
        postMessage(['debugRes', this.debugLightPath]);
        close();
    };
    RayTracer.prototype.trace = function () {
        console.log("Scene objects: " + this.scene.geometry.length);
        var maxIterations = 5;
        for (var iterations = 0; iterations < maxIterations; ++iterations) {
            for (var y = 0; y < this.rendererData.regionH; y++) {
                for (var x = 0; x < this.rendererData.regionW; x++) {
                    var pixX = x + this.rendererData.regionX + Math.random();
                    var pixY = y + this.rendererData.regionY + Math.random();
                    var pixID = (x * 4) + (y * this.rendererData.regionW * 4);
                    var ray = this.scene.camera.getRay(pixX, pixY, this.rendererData.screenW, this.rendererData.screenH);
                    var c = Color3.getCanvasColor(this.getRadiance(ray, 1));
                    this.imgData.data[pixID++] += c.r / maxIterations;
                    this.imgData.data[pixID++] += c.g / maxIterations;
                    this.imgData.data[pixID++] += c.b / maxIterations;
                    this.imgData.data[pixID++] = 255;
                }
                postMessage(['calculating', y]);
                postMessage(['result', this.imgData, JSON.stringify(this.rendererData)]);
            }
        }
        console.log('Posting message back to main script');
        postMessage(['result', this.imgData, JSON.stringify(this.rendererData)]);
        postMessage(['finished', JSON.stringify(this.rendererData)]);
        close();
    };
    return RayTracer;
})();
var SceneParser = (function () {
    function SceneParser() {
    }
    SceneParser.parseSceneFile = function (_fileURL, _scene, _tracer) {
        SceneParser.scene = _scene;
        SceneParser.tracer = _tracer;
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                SceneParser.parseSceneFileInternal(xhttp.responseText);
            }
        };
        xhttp.open("GET", _fileURL, true);
        xhttp.send();
    };
    SceneParser.escapeRegExp = function (_str) {
        return _str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    };
    SceneParser.replaceAll = function (_find, _replace, _str) {
        return _str.replace(new RegExp(SceneParser.escapeRegExp(_find), 'g'), _replace);
    };
    SceneParser.parseSceneFileInternal = function (_data) {
        var lines = _data.split('\n');
        var WHITESPACE_RE = /\s+/;
        var SCENE_SCALE = 5;
        var length = lines.length;
        var vertsID = 0;
        var matID = 0;
        var elID = 0;
        var currentMaterial;
        for (var i = 0; i < length; i++) {
            var line = lines[i].trim();
            line = SceneParser.replaceAll('(', '', line);
            line = SceneParser.replaceAll(')', '', line);
            var elements = line.split(WHITESPACE_RE);
            //elements.shift();
            elID = 0;
            if ('c' == elements[0]) {
                elements.shift();
                console.log(elements);
                var pos = new Vector3(+elements[elID++], +elements[elID++], +elements[elID++]);
                var dir = new Vector3(+elements[elID++], +elements[elID++], +elements[elID++]);
                SceneParser.scene.camera = new Camera(pos, dir, 0, 1000000.0);
            }
            else if ('m' == elements[0]) {
                elements.shift();
                var matType = elements[elID++];
                if ('diff' == matType) {
                    currentMaterial = new MatDiffuse(new Color3(elements[elID++], elements[elID++], elements[elID++]));
                }
                else {
                    currentMaterial = new MatDiffuse(new Color3(1, 1, 1));
                }
            }
            else if ('t' == elements[0]) {
                elements.shift();
                var v0 = new Vector3(elements[elID++], elements[elID++], elements[elID++]);
                var v1 = new Vector3(elements[elID++], elements[elID++], elements[elID++]);
                var v2 = new Vector3(elements[elID++], elements[elID++], elements[elID++]);
                SceneParser.scene.geometry.push(new Triangle(v0, v1, v2, currentMaterial));
            }
        }
        SceneParser.tracer.render();
    };
    return SceneParser;
})();
function runApp(_renderDataJSON, _imgData) {
    var scene = new Scene();
    var tracer = new RayTracer();
    var renderData = new RendererData();
    renderData.fillFromJSON(_renderDataJSON);
    tracer.scene = scene;
    tracer.imgData = _imgData;
    tracer.rendererData = renderData;
    SceneParser.parseSceneFile(renderData.sceneURI, scene, tracer);
}
onmessage = function (e) {
    console.log('Message received from main script');
    runApp(e.data[0], e.data[1]);
};
