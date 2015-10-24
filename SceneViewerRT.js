var SceneViewerRT = (function () {
	
	function SceneViewerRT(_viewportID) 
	{
		this.container = document.getElementById( _viewportID );
		
		this.canvas = document.createElement("canvas");
		this.canvas.width = 500;
		this.canvas.height = 500;
		
		this.container.appendChild( this.canvas );
		
		this.canvasContext = this.canvas.getContext("2d");
		
		var Signal = signals.Signal;
		
		this.progressUpdated = new Signal();
		
		this.rtWorkers = [];
	}
	
	SceneViewerRT.prototype.stopRendering = function() 
	{
		var worker = this.rtWorkers.pop();
		while (worker != undefined)
		{
			worker.terminate();
			worker = this.rtWorkers.pop()
		}
	}
	
	SceneViewerRT.prototype.startRendering = function() 
	{
		var that = this;
		var onWorkerMessage = function(e) 
		{
			switch (e.data[0]) {
				case 'result':
					var workerRegion = JSON.parse( e.data[2] );
					that.canvasContext.putImageData(e.data[1], workerRegion.regionX, workerRegion.regionY);
					break;
				
				case 'calculating':
					//var percentage = (e.data[1] / 255.0) * 100;
  					//that.progressUpdated.dispatch(percentage);
					break;
				
				case 'debugRes':
					break;
					
				case 'finished':
					break;
			}
        };

		for( var y=0; y<5; ++y )
		{
			for( var x=0; x<5; ++x )
			{
				var bucketData = {
					"regionX":x*100, "regionW":100,
					"regionY":y*100, "regionH":100,
					"screenW":500, 
					"screenH":500,					
					"tracingMode": "trace",
					"sceneURI" : "scenes/cornellbox-e.ml.txt"
					};
				
				var imgData = this.canvasContext.createImageData(
					bucketData.regionW, 
					bucketData.regionH
				);
						
				var worker = new Worker("js/Raytracer.js");
				worker.onmessage = onWorkerMessage;
				worker.postMessage([JSON.stringify(bucketData), imgData]);
				
				this.rtWorkers.push( worker );
			}
		}	
	}
	
	return SceneViewerRT;
})();