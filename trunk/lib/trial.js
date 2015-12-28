/*

	trial-js - JavaScript Test Support Library
	version 1.2
	
	Copyright (c) 2008 Mat Ryer, Simon Howard
	
	Please visit the project home at http://trialjs.googlecode.com/
	Documentation: http://code.google.com/p/trialjs/wiki/API
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

var trial = {
	version: "1.2"
};


trial.debugValue = function(v){
	
	var type = typeof v;
	var output = "";
	
	switch (type){
		case "string":
			output += "\"" + v.toString() + "\"";
			break;
		case "number":
			output += v.toString();
			break;
		case "object":
			
			if (typeof v.length != "undefined"){
				
				type = "array";
				output += "[";
				
				for (var property in v){
					var arrayContents = "";
					arrayContents += trial.debugValue(v[property]);
					output += arrayContents + ", ";
				}
				
				// trim off the last comma
				if (output.length > 2)
					output = output.substring(0, output.length - 2);
				
				output += "]";
				
			}
			
			break;
		default:
			output += "{" + v.toString() + "}";
			break;
	}
	
	return "(" + type + ") " + output;
	
};

trial.debug = function(){
	
	var output = "";
	
	for (var i = 0, l = arguments.length; i<l; i++) {
		
		output += trial.debugValue(arguments[i]);
		
		output += ", "
		
	}
	
	// trim off the last comma
	output = output.substring(0, output.length - 2);
	
	return output;
	
};


/// <summary>
/// trial.substitute((Object) object, (String) functionName, (Function) newFunction)
///
/// Swaps a function for another.  Can be undone by using trial.unsubstitute().
/// </summary>
/// <see>http://code.google.com/p/trialjs/wiki/Substitute</see>
trial.substitute = function(){
	
	var _obj = arguments[0];
	var _funcName = arguments[1];
	var _newFunc = arguments[2];
	
	_obj._substitutions = _obj._substitutions || {};
	
	// make sure they haven't already done this
	if (_obj._substitutions[_funcName])
		throw "Function '" + _funcName + "' has already been substituted.  Use trial.unsubstitute(obj, '" + _funcName + "') to revert the function before attempting to substitute it again.";

	// cache the original one
	_obj._substitutions[_funcName] = _obj[_funcName];
	
	// write the new one
	_obj[_funcName] = _newFunc;
	
	// return the trial object to allow for chaining
	return trial;
	
};

/// <summary>
/// trial.unsubstitute((Object) object, (String) functionName)
///
/// Reverts a function back to its original function.
/// </summary>
/// <see>http://code.google.com/p/trialjs/wiki/Substitute</see>
trial.unsubstitute = function(){

	var _obj = arguments[0];
	var _funcName = arguments[1];
	
	_obj._substitutions = _obj._substitutions || {};
	
	if (!_obj._substitutions[_funcName])
		throw "Cannot unsubstitute a function without previously substituting it.  '" + _funcName + "' has not been substituted.";
	
	_obj[_funcName] = _obj._substitutions[_funcName];

};

/// <summary>
/// trial.doesThrow(function)
///
/// Gets whether the function throws an exception or not.
/// </summary>
/// <see>http://code.google.com/p/trialjs/wiki/TestHelpers</see>
trial.doesThrow = function(){

	var _func = arguments[0];
	var didThrow;
	
	try {
		_func();
		didThrow = false;
	} catch (e) {
		didThrow = true;
	}

	if (didThrow)
		return true;
	else
		return false;

};


/// <summary>
/// trial.monitorFunc((Object) object, (String) function_name)
///   Adds monitoring to the function on the object specified by function_name.
/// </summary>
trial.monitorFunc = function(){

	var _obj = arguments[0];
	var _funcName = arguments[1];

	_obj.callsTo = _obj.callsTo || {};
	_obj.numberOfCallsTo = _obj.numberOfCallsTo || {};
	_obj.lastCallTo = _obj.lastCallTo || {};
	
	_obj.callsTo[_funcName] = [];
	_obj.numberOfCallsTo[_funcName] = 0;
	_obj.lastCallTo[_funcName] = null;
	
	_obj[_funcName] = function(){
		
		var __func = _obj[_funcName];
		var __context = _obj;
		var __funcName = _funcName;
		
		return function(){
		
			// increase the counter
			__context.numberOfCallsTo[__funcName]++;
			
			var result = undefined, error = null;
			
			try {
				// call the original function
				result = __func.apply(__context, arguments);
			} catch (e) {
				error = e;
			}
			
			__context.lastCallTo[__funcName] = {
				arguments: arguments,
				error: error,
				result: result
			};
			
			// add the call details to the calls_to array
			__context.callsTo[__funcName].push(__context.lastCallTo[__funcName]);
			
			// return the result
			return result;
			
		};
		
	}();

};

/// <summary>
/// trial.monitor((Object) object_to_monitor)
///   Adds monitoring capabilities to all functions in an object.
///
/// trial.monitor((Object) object_to_monitor, (String) function_name)
///   Adds monitoring capabilities to the function specified by the name.
/// </summary>
trial.monitor = function(){

	var _obj = arguments[0];
	var _funcName = arguments[1];
	
	if (!_funcName)
		for (var property in _obj)
			if (typeof _obj[property] == "function")
				trial.monitorFunc(_obj, property);
	else
		trial.monitorFunc.apply(trial, arguments);

};


trial.contains = function(){

	
	// validate request
	if (arguments.length < 2)
		throw "Incorrect usage.  (Boolean) trial.contains( (Object) subject, (Object) itemToFind )";
	if (arguments.length == 2 && (typeof arguments[0] == "undefined" || arguments[0] == null))
		throw "trial.contains requires the subject to be not null and not undefined.";
	
	var result = true;
	try{
		result = trial.doesContain.apply(this, arguments);
	}
	catch (e){
		result = false;
	}
	return result;
};


trial.doesContain = function(){
	
	var subject = arguments[0];

	if (arguments.length < 2)
		throw "Incorrect usage.  (Boolean) trial.contains( (Object) subject, (Object) itemToFind )";
	else if (arguments.length == 2){
	
		// get the item to find
		var itemToFind = arguments[1];
		
		if (typeof subject == "undefined" || subject == null)
			throw "trial.contains requires the subject to be not null and not undefined.";
		
		// look for the item in the subject
		switch (typeof subject){
		    case "string":
		    
		        return (arguments[0].indexOf(arguments[1]) > -1);
		    
		        break;
			case "object":
				
				if (subject.length) {
					
					// an array
					for (var i in subject) {
						if (subject[i] === itemToFind)
							return true; // found it
					}
					
					// couldn't find it
					throw "trial.doesContain could not find '" + trial.debug(itemToFind) + "' in '" + trial.debug(subject) + "'.";
					
				}
				
				break;
		}
	
	}
	else {
		
		// gather the arguments to find
		var itemsToFind = [];
		
		// check each item
		for (var i = 1, l = arguments.length; i < l; i++)
			if (!trial.contains(subject, arguments[i]))
				throw "trial.doesContain could not find '" + trial.debug(arguments[i]) + "' in '" + trial.debug(subject) + "'.";

		// we found all of the items we were looking for
		return true;
		
	};
	
	throw "No result was returned";
	
};