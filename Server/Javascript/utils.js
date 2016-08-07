var utils = {
	fillMat: function(input, mat) {
		for(var i = 0; i < input.length; i++) {
			for(var j = 0; j < input[0].length; j++) {
				mat.set(i, j, input[i][j]);
			}
		}
		return mat;
	},

	// adds bias and sets gradients smartly
	// assumes that each ROW is a single example
	addBias: function(graph, biasMat, hiddenMat) {
		var sum = new R.Mat(hiddenMat.n, hiddenMat.d);
		var batchSize = hiddenMat.n;
		var hiddenSize = hiddenMat.d;
		var idx = 0;
		for(var i = 0; i < batchSize; i++) {
			for(var j = 0; j < hiddenSize; j++) {
				sum.w[i*hiddenSize + j] = hiddenMat.w[i*hiddenSize + j] + biasMat.w[j];
			}
		}
		var back = function() {
			for(var i = 0; i < batchSize; i++) {
				for(var j = 0; j < hiddenSize; j++) {
					biasMat.dw[j] += sum.dw[i*hiddenSize + j]; 
					hiddenMat[i*hiddenSize + j] += sum.dw[i*hiddenSize + j]; 
				}
			}
		}
		graph.backprop.push(back);
		return sum;
	},

	// attaches gradients to a batch of labels
	// assumes that each ROW is a single example
	softmaxBatchGrads: function(activationMat, hiddens, labels) {
		var cost = 0; 
		var batchSize = labels.length; 
		var idx = 0; 
		for(var i = 0; i < batchSize; i++) {
			var label = labels[i];
			for(var j = 0; j < label.length; j++) {
				hiddens.dw[idx] =  activationMat.w[idx] - label[j]; 
				if(label[j] == 1) {
					cost += -Math.log(activationMat.w[j])
				}
				idx += 1;
			}
		}
		return cost; 
	},

	softmax: function(arrayVector) {
		var out = []
		var maxval = -999999;
		for(var i=0;i<arrayVector.length;i++) { if(arrayVector[i] > maxval) maxval = arrayVector[i]; }

		var s = 0.0;
		for(var i=0;i<arrayVector.length;i++) { 
			var exp = Math.exp(arrayVector[i] - maxval)
			out.push(exp);
			s += exp;
		}
		for(var i=0;i<out.length;i++) { out[i] /= s; }
		return out;
	},

	softmaxBatch: function(hiddens) {
		var batchSize = hiddens.n;
		var inputSize = hiddens.d;
		var out = new R.Mat(hiddens.n, hiddens.d);
		for(var idx = 0; idx < batchSize; idx++) {
			var input = hiddens.w.slice(idx * inputSize, idx * inputSize + inputSize);
			var softmax = this.softmax(input);
			for(var j = 0; j < inputSize; j++) {
				out.set(idx, j, softmax[j]);
			}
		}
		return out; 
	}
}
module.exports = utils;