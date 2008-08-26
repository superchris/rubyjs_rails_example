// declare nil
function NilClass() {}

// FIXME: remove
NilClass.prototype.toString = function() { return "nil"; };
nil = new NilClass();

//
// define a null-function (used by HTTPRequest)
//
function a$null_func()
{
}

//
// r: return value
// s: scope (method scope)
//
function a$iter_jump(r,s)
{
  this.a$return_value = r;
  this.a$scope = s; 
  return this;
}

//
// Throw in Javascript is a statement.
//
// This function can be used to overcome
// that limitation.
//
function a$throw_expr(x) { throw(x); }

function a$to_splat(a)
{
  // TODO
  return a;
}

// 
// helper function for multiple assignment in 
// iterator parameters.
// 
//   undefined -> []
//   1         -> [1]
//   [1]       -> [[1]]
//   []        -> [[]]
//   [1,2]     -> [1,2]
// 
function a$masgn_iter(a)
{
  if (a===undefined) return [];
  if (a.constructor!=Array || a.length<2) return [a];
  return a;
}

//
// Call the method in the superclass.
//
// As super is used quite rarely, we dont optimize for it.
// 
// object, method, iterator, arguments
//
function a$supercall(o, m, i, a) 
{
  var r = o[m]; // method in current class
  var c = o.a$_class.a$superclass;
  while (r === c.a$object_constructor.prototype[m])
    c = c.a$superclass;
  return c.a$object_constructor.prototype[m].apply(o, [i].concat(a));
}

function a$zsupercall(o, m, a) 
{
  var r = o[m]; // method in current class
  var c = o.a$_class.a$superclass;
  while (r === c.a$object_constructor.prototype[m])
    c = c.a$superclass;
  return c.a$object_constructor.prototype[m].apply(o, a);
}

//
// Whether o.kind_of?(c)
//
function a$kind_of(o, c)
{
  var k,i,m;

  k = o.a$_class;

  while (k != nil)
  {
    if (k === c) return true;

    // check included modules
    m = k.a$modules;
    for (i=0; i<m.length; i++)
    {
      if (m[i] === c) return true;
    }

    k = k.a$superclass; 
  }

  return false;
}

function a$rebuild_classes(c)
{
  for (var i=0; i<c.length; i++)
    a$rebuild_class(c[i]);
}

function a$rebuild_class(c)
{
  var k,i;

  //
  // include modules
  //
  // do that before, because when assigning instance methods of 
  // the super class, a check for === undefined prevents this method 
  // from being overwritten.
  //
  for (i=0; i<c.a$modules.length; i++)
  {
    for (k in c.a$modules[i].a$object_constructor.prototype)
    {
      if (c.a$object_constructor.prototype[k]===undefined)
      {
        c.a$object_constructor.prototype[k] = c.a$modules[i].a$object_constructor.prototype[k];
      }
    }
  }

  // instance methods
  if (c.a$superclass != nil)
  {
    for (k in c.a$superclass.a$object_constructor.prototype)
    {
      if (c.a$object_constructor.prototype[k]===undefined)
      {
        c.a$object_constructor.prototype[k] = c.a$superclass.a$object_constructor.prototype[k];
      }
    }
  }

  // inherit class methods from superclass
  if (c.a$superclass != nil)
  {
    for (k in c.a$superclass)
    {
      if (c[k]===undefined)
      {
        c[k] = c.a$superclass[k];
      }
    }
  }

  // set class for instanciated objects
  c.a$object_constructor.prototype.a$_class = c;
}

function a$def_class(h)
{
  var c,k,i;
  c = h.a$_class || $Class.$new(nil, h.a$superclass, h.a$classname, h.a$object_constructor);

  if (h.a$instance_methods)
  {
    for (k in h.a$instance_methods)
    {
      c.a$object_constructor.prototype[k] = h.a$instance_methods[k];
    }
  }

  if (h.a$methods)
  {
    for (k in h.a$methods) c[k] = h.a$methods[k];
  }

  if (h.a$modules)
  {
    for (i=0; i<h.a$modules.length; i++)
    {
      c.a$modules.push(h.a$modules[i]);
    }
  }

  return c;
}

function a$MetaClass(__class, _superclass, _classname, _object_constructor) 
{
  this.a$superclass = _superclass;
  this.a$classname = _classname;
  this.a$object_constructor = _object_constructor;
  this.a$modules = [];
  this.a$_class = __class;
  return this;
}

a$MetaClass.$name = function() { return "MetaClass"; };
a$MetaClass.$class = function() { return this; };
//
// Generates a new method_missing function
// for the given symbol +sym+.
// 
var a$mm_fun_cache = {}; 
function a$mm_fun(sym)
{
  if (!a$mm_fun_cache[sym])
  {
    var fn = function() {
      return a$call_method_missing(this, arguments, sym);
    };
    fn.a$_mm = true;
    a$mm_fun_cache[sym] = fn;
  }

  return a$mm_fun_cache[sym];
}

function a$call_method_missing(obj, args, sym)
{
  var i, a;
  a = [];
  if (args.length == 0)
    a.push(nil);
  else
    a.push(args[0]);

  a.push(a$mm[sym] || nil);

  for (i=1; i<args.length; i++)
    a.push(args[i]);
  
  var m = obj.$method_missing;

  if (m)
    return m.apply(obj, a);
  else
    throw "FATAL: method_missing missing";
}

//
// assign method_missing stubs
//
function a$mm_assign(c)
{
  var i;

  for (i in a$mm)  
  {
    if (c.a$object_constructor.prototype[i]===undefined)
    {
      c.a$object_constructor.prototype[i] = a$mm_fun(i);
    }
  }

  if (c.a$superclass != nil)
  {
    for (i in c.a$superclass)
    {
      if (c[i]===undefined)
      {
        c[i] = a$mm_fun(i);
      }
    }
  }
}
// method map
var a$mm = {"$___at":"[]","$to_a":"to_a","$___mod":"%","$to_s":"to_s","$respond_to___quest":"respond_to?","$reverse___not":"reverse!","$to_ary":"to_ary","$___xor":"^","$___band":"&","$p":"p","$include___quest":"include?","$succ":"succ","$kind_of___quest":"kind_of?","$upto":"upto","$___set":"[]=","$find_all":"find_all","$begin":"begin","$new":"new","$___eq":"==","$delete":"delete","$tap":"tap","$is_a___quest":"is_a?","$find_js_element":"find_js_element","$push":"push","$___lt":"<","$strip":"strip","$observe":"observe","$clear":"clear","$say_hello":"say_hello","$reject":"reject","$___mul":"*","$times":"times","$first":"first","$message":"message","$to_f":"to_f","$each_with_index":"each_with_index","$member___quest":"member?","$puts":"puts","$___gt":">","$___plus":"+","$find":"find","$size":"size","$length":"length","$___eqq":"===","$empty___quest":"empty?","$__invoke":"__invoke","$shift":"shift","$nil___quest":"nil?","$gsub":"gsub","$send":"send","$call":"call","$___minus":"-","$to_i":"to_i","$ljust":"ljust","$keys":"keys","$instance_of___quest":"instance_of?","$loop":"loop","$method":"method","$raise":"raise","$name":"name","$rjust":"rjust","$inner_html":"inner_html","$pop":"pop","$___ge":">=","$___div":"/","$eql___quest":"eql?","$inspect":"inspect","$instance_methods":"instance_methods","$class":"class","$___lshift":"<<","$___eq___neg":"=~","$inner_html___eq":"inner_html=","$___le":"<=","$methods":"methods","$dup":"dup","$unshift":"unshift","$___minus___ivar":"-@","$___bor":"|","$each":"each","$map":"map","$___plus___ivar":"+@","$downto":"downto","$index":"index","$sub":"sub","$new_from_jsobject":"new_from_jsobject","$collect":"collect","$___neg":"~","$allocate":"allocate","$end":"end","$last":"last","$__send":"__send","$split":"split","$join":"join","$hash":"hash","$method_missing":"method_missing","$reverse":"reverse","$select":"select","$proc":"proc","$exclude_end___quest":"exclude_end?","$to_splat":"to_splat","$new_from_key_value_list":"new_from_key_value_list","$values":"values","$initialize":"initialize"};
var a$mm_reverse = {};
for (var i in a$mm) a$mm_reverse[a$mm[i]] = i;
$Class = a$def_class({a$superclass: nil,a$methods: {$new:
/* Class.new */
function(_tmp_1,_superclass,_classname,_object_constructor){var self,_tmp_0;
self=this;
try{if(arguments.length<3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
if(arguments.length>4)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 3)'));
if(_object_constructor==null)_object_constructor=nil;
;
if((_tmp_0=_object_constructor,_tmp_0===false||_tmp_0===nil)){_object_constructor=(function() {})};
return new self.a$object_constructor($Class, _superclass, _classname, _object_constructor);}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==2))return _tmp_2.a$return_value;
throw(_tmp_2)}}

},a$classname: "Class",a$_class: new a$MetaClass(a$MetaClass, nil, "Class", a$MetaClass),a$instance_methods: {$name:
/* Class#name */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.a$classname}

,$new:
/* Class#new */
function(_tmp_1){var self,_obj,_block,_args,_tmp_0,_tmp_2;
_tmp_2=nil;
self=this;
_block=_tmp_1==null?nil:_tmp_1;
try{_args=[];
for(_tmp_0=1;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;
_obj=self.$allocate();
_obj.$__invoke(_block,'$initialize',a$to_splat(_args));
_tmp_2=_obj;
return _tmp_2}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==0))return _tmp_3.a$return_value;
throw(_tmp_3)}}

,$___eqq:
/* Class#=== */
function(_tmp_2,_other){var self,_tmp_0,_tmp_1;
_tmp_1=nil;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_tmp_1=(_tmp_0=self.$eql___quest(nil,_other), (_tmp_0!==false&&_tmp_0!==nil) ? _tmp_0 : (_other.$kind_of___quest(nil,self)));
return _tmp_1}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==1))return _tmp_3.a$return_value;
throw(_tmp_3)}}

,$allocate:
/* Class#allocate */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return (new self.a$object_constructor())}

,$instance_methods:
/* Class#instance_methods */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=self.$allocate().$methods();
return _tmp_0}

,$inspect:
/* Class#inspect */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.a$classname}

}});a$rebuild_class($Class);$Kernel = a$def_class({a$modules: [],a$superclass: nil,a$classname: "Kernel",a$instance_methods: {$__send:
/* Kernel#__send */
function(_tmp_1,_id){var self,_block,_args,_tmp_0;
self=this;
_block=_tmp_1==null?nil:_tmp_1;
try{if(arguments.length<2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
_args=[];
for(_tmp_0=2;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;

    var m = self[a$mm_reverse[_id]];
    if (m) 
      return m.apply(self, [_block].concat(_args));
    else
      return self.$method_missing.apply(self, [_block].concat([_id]).concat(_args));}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==4))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$method_missing:
/* Kernel#method_missing */
function(_tmp_1,_id){var self,_block,_args,_tmp_0,_tmp_2;
_tmp_2=nil;
self=this;
_block=_tmp_1==null?nil:_tmp_1;
try{if(arguments.length<2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
_args=[];
for(_tmp_0=2;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;
_tmp_2=self.$raise(nil,$NoMethodError,("undefined method `" + ((_id).$to_s()) + ("' for ") + ((self.$inspect()).$to_s())));
return _tmp_2}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==3))return _tmp_3.a$return_value;
throw(_tmp_3)}}

,$raise:
/* Kernel#raise */
function(){var self,_args,_ex,_tmp_0,_first;
self=this;
_args=[];
for(_tmp_0=1;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;
_ex=((_tmp_0=_args.$empty___quest(),_tmp_0!==false&&_tmp_0!==nil)?$RuntimeError.$new(nil,""):(_first=_args.$shift(),((_tmp_0=_first.$kind_of___quest(nil,$Class),_tmp_0!==false&&_tmp_0!==nil)?_first.$__invoke(nil,'$new',a$to_splat(_args)):((_tmp_0=_first.$instance_of___quest(nil,$Exception),_tmp_0!==false&&_tmp_0!==nil)?((_tmp_0=_args.$empty___quest(),_tmp_0!==false&&_tmp_0!==nil)?_first:$ArgumentError.$new(nil,"to many arguments given to raise")):((_tmp_0=_first.$instance_of___quest(nil,$String),_tmp_0!==false&&_tmp_0!==nil)?((_tmp_0=_args.$empty___quest(),_tmp_0!==false&&_tmp_0!==nil)?$RuntimeError.$new(nil,_first):$ArgumentError.$new(nil,"to many arguments given to raise")):$TypeError.$new(nil,"exception class/object expected"))))));
throw(_ex)}

,$nil___quest:
/* Kernel#nil? */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=false;
return _tmp_0}

,$proc:
/* Kernel#proc */
function(_tmp_0){var self,_block,_tmp_1;
_tmp_1=nil;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_1=$Proc.$new(_block);
return _tmp_1}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==6))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$respond_to___quest:
/* Kernel#respond_to? */
function(_tmp_0,_id){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;

    var m = a$mm_reverse[_id]; 
    return (m !== undefined && self[m] !== undefined && !self[m].a$_mm)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==5))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$p:
/* Kernel#p */
function(){var self,_args,_tmp_0,_tmp_3;
_tmp_3=nil;
self=this;
_args=[];
for(_tmp_0=1;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;
_args.$each(function(_tmp_1){var _arg;
var _tmp_2=nil;
_arg=_tmp_1==null?nil:_tmp_1;
_tmp_2=self.$puts(nil,_arg.$inspect());
return _tmp_2});
_tmp_3=nil;
return _tmp_3}

,$__invoke:
/* Kernel#__invoke */
function(_tmp_0,_id,_args){var self,_block;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
try{if(arguments.length!=3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
;

    var m = self[_id];
    if (m)
      return m.apply(self, [_block].concat(_args));
    else
      return self.$method_missing.apply(self, 
        [_block].concat([a$mm[_id]]).concat(_args));}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==7))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$loop:
/* Kernel#loop */
function(_tmp_0){var self,_tmp_1;
_tmp_1=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
while(true){_tmp_0()};
_tmp_1=nil;
;
return _tmp_1}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==10))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$puts:
/* Kernel#puts */
function(_tmp_0,_str){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_str=_str.$to_s();
alert(_str); return nil}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==9))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$send:
/* Kernel#send */
function(_tmp_1,_id){var self,_block,_args,_tmp_0;
self=this;
_block=_tmp_1==null?nil:_tmp_1;
try{if(arguments.length<2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
_args=[];
for(_tmp_0=2;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;

    var m = self[a$mm_reverse[_id]];
    if (m) 
      return m.apply(self, [_block].concat(_args));
    else
      return self.$method_missing.apply(self, [_block].concat([_id]).concat(_args));}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==8))return _tmp_2.a$return_value;
throw(_tmp_2)}}

}});$Object = a$def_class({a$modules: [$Kernel],a$superclass: nil,a$classname: "Object",a$instance_methods: {$kind_of___quest:
/* Object#kind_of? */
function(_tmp_0,_klass){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return a$kind_of(self, _klass)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==11))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$methods:
/* Object#methods */
function(){var self,_methods,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_methods=[];
for (meth in self) {
       if (typeof self[meth] == "function") {
         _methods.push(a$mm[meth]);
       }
    };
_tmp_0=_methods;
return _tmp_0}

,$is_a___quest:
/* Object#is_a? */
function(_tmp_0,_klass){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return a$kind_of(self, _klass)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==14))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$__send:
/* Object#__send */
function(_tmp_1,_id){var self,_block,_args,_tmp_0;
self=this;
_block=_tmp_1==null?nil:_tmp_1;
try{if(arguments.length<2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
_args=[];
for(_tmp_0=2;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;

    var m = self[a$mm_reverse[_id]];
    if (m) 
      return m.apply(self, [_block].concat(_args));
    else
      return self.$method_missing.apply(self, [_block].concat([_id]).concat(_args));}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==13))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$method_missing:
/* Object#method_missing */
function(_tmp_1,_id){var self,_block,_args,_tmp_0,_tmp_2;
_tmp_2=nil;
self=this;
_block=_tmp_1==null?nil:_tmp_1;
try{if(arguments.length<2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
_args=[];
for(_tmp_0=2;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;
_tmp_2=self.$raise(nil,$NoMethodError,("undefined method `" + ((_id).$to_s()) + ("' for ") + ((self.$inspect()).$to_s())));
return _tmp_2}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==12))return _tmp_3.a$return_value;
throw(_tmp_3)}}

,$raise:
/* Object#raise */
function(){var self,_args,_ex,_tmp_0,_first;
self=this;
_args=[];
for(_tmp_0=1;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;
_ex=((_tmp_0=_args.$empty___quest(),_tmp_0!==false&&_tmp_0!==nil)?$RuntimeError.$new(nil,""):(_first=_args.$shift(),((_tmp_0=_first.$kind_of___quest(nil,$Class),_tmp_0!==false&&_tmp_0!==nil)?_first.$__invoke(nil,'$new',a$to_splat(_args)):((_tmp_0=_first.$instance_of___quest(nil,$Exception),_tmp_0!==false&&_tmp_0!==nil)?((_tmp_0=_args.$empty___quest(),_tmp_0!==false&&_tmp_0!==nil)?_first:$ArgumentError.$new(nil,"to many arguments given to raise")):((_tmp_0=_first.$instance_of___quest(nil,$String),_tmp_0!==false&&_tmp_0!==nil)?((_tmp_0=_args.$empty___quest(),_tmp_0!==false&&_tmp_0!==nil)?$RuntimeError.$new(nil,_first):$ArgumentError.$new(nil,"to many arguments given to raise")):$TypeError.$new(nil,"exception class/object expected"))))));
throw(_ex)}

,$class:
/* Object#class */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.a$_class}

,$eql___quest:
/* Object#eql? */
function(_tmp_0,_other){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return (self.constructor == _other.constructor && self == _other)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==15))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$hash:
/* Object#hash */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.toString()}

,$tap:
/* Object#tap */
function(_tmp_0){var self,_tmp_1;
_tmp_1=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0(self);
_tmp_1=self;
return _tmp_1}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==16))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$nil___quest:
/* Object#nil? */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=false;
return _tmp_0}

,$to_s:
/* Object#to_s */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.toString()}

,$proc:
/* Object#proc */
function(_tmp_0){var self,_block,_tmp_1;
_tmp_1=nil;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_1=$Proc.$new(_block);
return _tmp_1}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==18))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$respond_to___quest:
/* Object#respond_to? */
function(_tmp_0,_id){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;

    var m = a$mm_reverse[_id]; 
    return (m !== undefined && self[m] !== undefined && !self[m].a$_mm)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==17))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$initialize:
/* Object#initialize */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=nil;
return _tmp_0}

,$method:
/* Object#method */
function(_tmp_1,_id){var self,_tmp_0;
_tmp_0=nil;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_tmp_0=$Method.$new(nil,self,_id);
return _tmp_0}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==19))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$p:
/* Object#p */
function(){var self,_args,_tmp_0,_tmp_3;
_tmp_3=nil;
self=this;
_args=[];
for(_tmp_0=1;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;
_args.$each(function(_tmp_1){var _arg;
var _tmp_2=nil;
_arg=_tmp_1==null?nil:_tmp_1;
_tmp_2=self.$puts(nil,_arg.$inspect());
return _tmp_2});
_tmp_3=nil;
return _tmp_3}

,$__invoke:
/* Object#__invoke */
function(_tmp_0,_id,_args){var self,_block;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
try{if(arguments.length!=3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
;

    var m = self[_id];
    if (m)
      return m.apply(self, [_block].concat(_args));
    else
      return self.$method_missing.apply(self, 
        [_block].concat([a$mm[_id]]).concat(_args));}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==20))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___eqq:
/* Object#=== */
function(_tmp_2,_other){var self,_tmp_0,_tmp_1;
_tmp_1=nil;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_tmp_1=(_tmp_0=self.$eql___quest(nil,_other), (_tmp_0!==false&&_tmp_0!==nil) ? _tmp_0 : (self.$kind_of___quest(nil,_other)));
return _tmp_1}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==21))return _tmp_3.a$return_value;
throw(_tmp_3)}}

,$instance_of___quest:
/* Object#instance_of? */
function(_tmp_0,_klass){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return (self.a$_class === _klass)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==25))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$send:
/* Object#send */
function(_tmp_1,_id){var self,_block,_args,_tmp_0;
self=this;
_block=_tmp_1==null?nil:_tmp_1;
try{if(arguments.length<2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
_args=[];
for(_tmp_0=2;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;

    var m = self[a$mm_reverse[_id]];
    if (m) 
      return m.apply(self, [_block].concat(_args));
    else
      return self.$method_missing.apply(self, [_block].concat([_id]).concat(_args));}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==24))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$loop:
/* Object#loop */
function(_tmp_0){var self,_tmp_1;
_tmp_1=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
while(true){_tmp_0()};
_tmp_1=nil;
;
return _tmp_1}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==23))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$puts:
/* Object#puts */
function(_tmp_0,_str){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_str=_str.$to_s();
alert(_str); return nil}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==22))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$inspect:
/* Object#inspect */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.toString()}

}});$Range = a$def_class({a$modules: [],a$superclass: $Object,a$classname: "Range",a$instance_methods: {$___eq:
/* Range#== */
function(_tmp_3,_obj){var self,_tmp_0,_tmp_1,_tmp_2;
_tmp_2=nil;
self=this;
if(self.$___ivarlast==null)self.$___ivarlast=nil;
if(self.$___ivarfirst==null)self.$___ivarfirst=nil;
if(self.$___ivarexclude_last==null)self.$___ivarexclude_last=nil;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
if (self.constructor != _obj.constructor) return false;;
_tmp_2=(_tmp_0=self.$___ivarfirst.$___eq(nil,_obj.$first()), (_tmp_0!==false&&_tmp_0!==nil) ? ((_tmp_1=self.$___ivarlast.$___eq(nil,_obj.$last()), (_tmp_1!==false&&_tmp_1!==nil) ? (self.$___ivarexclude_last.$___eq(nil,_obj.$exclude_end___quest())) : _tmp_1)) : _tmp_0);
return _tmp_2}catch(_tmp_4){if(_tmp_4 instanceof a$iter_jump && (!_tmp_4.a$scope || _tmp_4.a$scope==26))return _tmp_4.a$return_value;
throw(_tmp_4)}}

,$begin:
/* Range#begin */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivarfirst==null)self.$___ivarfirst=nil;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=self.$___ivarfirst;
return _tmp_0}

,$eql___quest:
/* Range#eql? */
function(_tmp_3,_obj){var self,_tmp_0,_tmp_1,_tmp_2;
_tmp_2=nil;
self=this;
if(self.$___ivarlast==null)self.$___ivarlast=nil;
if(self.$___ivarfirst==null)self.$___ivarfirst=nil;
if(self.$___ivarexclude_last==null)self.$___ivarexclude_last=nil;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
if (self.constructor != _obj.constructor) return false;;
_tmp_2=(_tmp_0=self.$___ivarfirst.$eql___quest(nil,_obj.$first()), (_tmp_0!==false&&_tmp_0!==nil) ? ((_tmp_1=self.$___ivarlast.$eql___quest(nil,_obj.$last()), (_tmp_1!==false&&_tmp_1!==nil) ? (self.$___ivarexclude_last.$___eq(nil,_obj.$exclude_end___quest())) : _tmp_1)) : _tmp_0);
return _tmp_2}catch(_tmp_4){if(_tmp_4 instanceof a$iter_jump && (!_tmp_4.a$scope || _tmp_4.a$scope==27))return _tmp_4.a$return_value;
throw(_tmp_4)}}

,$exclude_end___quest:
/* Range#exclude_end? */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivarexclude_last==null)self.$___ivarexclude_last=nil;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=self.$___ivarexclude_last;
return _tmp_0}

,$last:
/* Range#last */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivarlast==null)self.$___ivarlast=nil;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=self.$___ivarlast;
return _tmp_0}

,$to_s:
/* Range#to_s */
function(){var self,_tmp_1,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivarlast==null)self.$___ivarlast=nil;
if(self.$___ivarfirst==null)self.$___ivarfirst=nil;
if(self.$___ivarexclude_last==null)self.$___ivarexclude_last=nil;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
if((_tmp_1=self.$___ivarexclude_last,_tmp_1!==false&&_tmp_1!==nil)){_tmp_0=("" + ((self.$___ivarfirst).$to_s()) + ("...") + ((self.$___ivarlast).$to_s()))}else{_tmp_0=("" + ((self.$___ivarfirst).$to_s()) + ("..") + ((self.$___ivarlast).$to_s()))};
return _tmp_0}

,$each:
/* Range#each */
function(_tmp_1){var self,_current,_tmp_0,_tmp_2;
_tmp_2=nil;
self=this;
if(self.$___ivarlast==null)self.$___ivarlast=nil;
if(self.$___ivarfirst==null)self.$___ivarfirst=nil;
if(self.$___ivarexclude_last==null)self.$___ivarexclude_last=nil;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_current=self.$___ivarfirst;
if((_tmp_0=self.$___ivarfirst.$___gt(nil,self.$___ivarlast),_tmp_0!==false&&_tmp_0!==nil)){return nil};
if((_tmp_0=self.$___ivarexclude_last,_tmp_0!==false&&_tmp_0!==nil)){while((_tmp_0=_current.$___lt(nil,self.$___ivarlast),_tmp_0!==false&&_tmp_0!==nil)){_tmp_1(_current);
_current=_current.$succ()};
_tmp_2=nil;
}else{while((_tmp_0=_current.$___le(nil,self.$___ivarlast),_tmp_0!==false&&_tmp_0!==nil)){_tmp_1(_current);
_current=_current.$succ()};
_tmp_2=nil;
};
return _tmp_2}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==30))return _tmp_3.a$return_value;
throw(_tmp_3)}}

,$end:
/* Range#end */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivarlast==null)self.$___ivarlast=nil;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=self.$___ivarlast;
return _tmp_0}

,$first:
/* Range#first */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivarfirst==null)self.$___ivarfirst=nil;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=self.$___ivarfirst;
return _tmp_0}

,$include___quest:
/* Range#include? */
function(_tmp_2,_obj){var self,_tmp_0,_tmp_1;
_tmp_1=nil;
self=this;
if(self.$___ivarlast==null)self.$___ivarlast=nil;
if(self.$___ivarfirst==null)self.$___ivarfirst=nil;
if(self.$___ivarexclude_last==null)self.$___ivarexclude_last=nil;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
if((_tmp_0=_obj.$___lt(nil,self.$___ivarfirst),_tmp_0!==false&&_tmp_0!==nil)){return false};
if((_tmp_0=self.$___ivarexclude_last,_tmp_0!==false&&_tmp_0!==nil)){_tmp_1=_obj.$___lt(nil,self.$___ivarlast)}else{_tmp_1=_obj.$___le(nil,self.$___ivarlast)};
return _tmp_1}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==29))return _tmp_3.a$return_value;
throw(_tmp_3)}}

,$initialize:
/* Range#initialize */
function(_tmp_2,_first,_last,_exclude_last){var self,_tmp_0,_tmp_1;
_tmp_1=nil;
self=this;
try{if(arguments.length<3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
if(arguments.length>4)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 3)'));
if(_exclude_last==null)_exclude_last=false;
;
(_tmp_0=[_first,_last],self.$___ivarfirst=_tmp_0[0]==null?nil:_tmp_0[0],self.$___ivarlast=_tmp_0[1]==null?nil:_tmp_0[1],_tmp_0);
_tmp_1=self.$___ivarexclude_last=((_tmp_0=_exclude_last,_tmp_0!==false&&_tmp_0!==nil)?true:false);
return _tmp_1}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==28))return _tmp_3.a$return_value;
throw(_tmp_3)}}

,$___eqq:
/* Range#=== */
function(_tmp_2,_obj){var self,_tmp_0,_tmp_1;
_tmp_1=nil;
self=this;
if(self.$___ivarlast==null)self.$___ivarlast=nil;
if(self.$___ivarfirst==null)self.$___ivarfirst=nil;
if(self.$___ivarexclude_last==null)self.$___ivarexclude_last=nil;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
if((_tmp_0=_obj.$___lt(nil,self.$___ivarfirst),_tmp_0!==false&&_tmp_0!==nil)){return false};
if((_tmp_0=self.$___ivarexclude_last,_tmp_0!==false&&_tmp_0!==nil)){_tmp_1=_obj.$___lt(nil,self.$___ivarlast)}else{_tmp_1=_obj.$___le(nil,self.$___ivarlast)};
return _tmp_1}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==31))return _tmp_3.a$return_value;
throw(_tmp_3)}}

,$to_a:
/* Range#to_a */
function(){var self,_arr,_current,_tmp_0;
self=this;
if(self.$___ivarlast==null)self.$___ivarlast=nil;
if(self.$___ivarfirst==null)self.$___ivarfirst=nil;
if(self.$___ivarexclude_last==null)self.$___ivarexclude_last=nil;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_arr=[];
if((_tmp_0=self.$___ivarfirst.$___gt(nil,self.$___ivarlast),_tmp_0!==false&&_tmp_0!==nil)){return _arr};
_current=self.$___ivarfirst;
if((_tmp_0=self.$___ivarexclude_last,_tmp_0!==false&&_tmp_0!==nil)){while((_tmp_0=_current.$___lt(nil,self.$___ivarlast),_tmp_0!==false&&_tmp_0!==nil)){_arr.$___lshift(nil,_current);
_current=_current.$succ()}}else{while((_tmp_0=_current.$___le(nil,self.$___ivarlast),_tmp_0!==false&&_tmp_0!==nil)){_arr.$___lshift(nil,_current);
_current=_current.$succ()}};
return _arr}

,$inspect:
/* Range#inspect */
function(){var self,_tmp_1,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivarlast==null)self.$___ivarlast=nil;
if(self.$___ivarfirst==null)self.$___ivarfirst=nil;
if(self.$___ivarexclude_last==null)self.$___ivarexclude_last=nil;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
if((_tmp_1=self.$___ivarexclude_last,_tmp_1!==false&&_tmp_1!==nil)){_tmp_0=("" + ((self.$___ivarfirst.$inspect()).$to_s()) + ("...") + ((self.$___ivarlast.$inspect()).$to_s()))}else{_tmp_0=("" + ((self.$___ivarfirst.$inspect()).$to_s()) + ("..") + ((self.$___ivarlast.$inspect()).$to_s()))};
return _tmp_0}

,$member___quest:
/* Range#member? */
function(_tmp_2,_obj){var self,_tmp_0,_tmp_1;
_tmp_1=nil;
self=this;
if(self.$___ivarlast==null)self.$___ivarlast=nil;
if(self.$___ivarfirst==null)self.$___ivarfirst=nil;
if(self.$___ivarexclude_last==null)self.$___ivarexclude_last=nil;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
if((_tmp_0=_obj.$___lt(nil,self.$___ivarfirst),_tmp_0!==false&&_tmp_0!==nil)){return false};
if((_tmp_0=self.$___ivarexclude_last,_tmp_0!==false&&_tmp_0!==nil)){_tmp_1=_obj.$___lt(nil,self.$___ivarlast)}else{_tmp_1=_obj.$___le(nil,self.$___ivarlast)};
return _tmp_1}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==32))return _tmp_3.a$return_value;
throw(_tmp_3)}}

}});$Exception = a$def_class({a$modules: [],a$superclass: $Object,a$classname: "Exception",a$instance_methods: {$message:
/* Exception#message */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivarmessage==null)self.$___ivarmessage=nil;
_tmp_0=self.$___ivarmessage;
return _tmp_0}

,$to_s:
/* Exception#to_s */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivarmessage==null)self.$___ivarmessage=nil;
_tmp_0=self.$___ivarmessage;
return _tmp_0}

,$initialize:
/* Exception#initialize */
function(_tmp_2,_message){var self,_tmp_1,_tmp_0;
_tmp_0=nil;
self=this;
try{if(arguments.length>2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
if(_message==null)_message=nil;
;
if((_tmp_1=_message.$nil___quest(),_tmp_1!==false&&_tmp_1!==nil)){_tmp_0=self.$___ivarmessage=self.$class().$name()}else{_tmp_0=self.$___ivarmessage=_message};
return _tmp_0}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==33))return _tmp_3.a$return_value;
throw(_tmp_3)}}

,$inspect:
/* Exception#inspect */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivarmessage==null)self.$___ivarmessage=nil;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=("#<" + ((self.$class().$name()).$to_s()) + (": ") + ((self.$___ivarmessage).$to_s()) + (">"));
return _tmp_0}

}});$StandardError = a$def_class({a$modules: [],a$superclass: $Exception,a$classname: "StandardError"});$NameError = a$def_class({a$modules: [],a$superclass: $StandardError,a$classname: "NameError"});$NoMethodError = a$def_class({a$modules: [],a$superclass: $NameError,a$classname: "NoMethodError"});$ArgumentError = a$def_class({a$modules: [],a$superclass: $StandardError,a$classname: "ArgumentError"});$Number = a$def_class({a$modules: [],a$superclass: $Object,a$classname: "Number",a$object_constructor: Number,a$instance_methods: {$___plus:
/* Number#+ */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self + _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==37))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___eq:
/* Number#== */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self == _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==36))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$downto:
/* Number#downto */
function(_tmp_1,_x){var self,_tmp_0,_i;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_i=self;
while((_tmp_0=_i.$___ge(nil,_x),_tmp_0!==false&&_tmp_0!==nil)){_tmp_1(_i);
_i=_i.$___minus(nil,1)};
return self}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==35))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$upto:
/* Number#upto */
function(_tmp_1,_x){var self,_tmp_0,_i;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_i=self;
while((_tmp_0=_i.$___le(nil,_x),_tmp_0!==false&&_tmp_0!==nil)){_tmp_1(_i);
_i=_i.$___plus(nil,1)};
return self}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==34))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$___le:
/* Number#<= */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self <= _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==38))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___minus:
/* Number#- */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self - _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==39))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$succ:
/* Number#succ */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self+1}

,$___div:
/* Number#/ */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self / _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==41))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$to_s:
/* Number#to_s */
function(_tmp_0,_base){var self;
self=this;
try{if(arguments.length>2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
if(_base==null)_base=10;
;
return self.toString(_base)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==40))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___mod:
/* Number#% */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self % _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==42))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___band:
/* Number#& */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self & _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==46))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___lt:
/* Number#< */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self < _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==45))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$times:
/* Number#times */
function(_tmp_1){var self,_tmp_0,_i;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_i=0;
while((_tmp_0=_i.$___lt(nil,self),_tmp_0!==false&&_tmp_0!==nil)){_tmp_1(_i);
_i=_i.$___plus(nil,1)};
return self}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==44))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$___bor:
/* Number#| */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self | _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==43))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___minus___ivar:
/* Number#-@ */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return -self}

,$___gt:
/* Number#> */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self > _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==48))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___xor:
/* Number#^ */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self ^ _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==47))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___neg:
/* Number#~ */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return ~self}

,$___ge:
/* Number#>= */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self >= _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==49))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$inspect:
/* Number#inspect */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.toString()}

,$___mul:
/* Number#* */
function(_tmp_0,_x){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self * _x}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==50))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___plus___ivar:
/* Number#+@ */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self}

}});$Fixnum = a$def_class({a$modules: [],a$superclass: $Number,a$classname: "Fixnum",a$object_constructor: Number});$Proc = a$def_class({a$modules: [],a$superclass: $Object,a$methods: {$new:
/* Proc.new */
function(_tmp_0){var self,_block,_tmp_1;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
if((_tmp_1=_block,_tmp_1===false||_tmp_1===nil)){self.$raise(nil,$ArgumentError,"tried to create Proc object without a block")};
return (function() {
      try {
        return _block.$call.apply(_block, arguments);
      } catch(e) 
      {
        if (e instanceof a$iter_jump) 
        {
          if (e.a$scope == null)
          {;
self.$raise(nil,$LocalJumpError,"break from proc-closure");
}
          return e.a$return_value;
        }
        else throw(e);
      }
    })}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==51))return _tmp_2.a$return_value;
throw(_tmp_2)}}

},a$classname: "Proc",a$object_constructor: Function,a$instance_methods: {$call:
/* Proc#call */
function(){var self,_args,_tmp_0;
self=this;
_args=[];
for(_tmp_0=1;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;

    // TODO: use switch/case
    if (_args.length == 0) return self();
    else if (_args.length == 1) return self(_args[0]);
    else return self(_args);}

}});$LocalJumpError = a$def_class({a$modules: [],a$superclass: $StandardError,a$classname: "LocalJumpError"});$Bignum = a$def_class({a$modules: [],a$superclass: $Number,a$classname: "Bignum",a$object_constructor: Number});$Enumerable = a$def_class({a$modules: [],a$superclass: nil,a$classname: "Enumerable",a$instance_methods: {$collect:
/* Enumerable#collect */
function(_tmp_0){var _tmp_2,self,_block,_result,_tmp_4;
_tmp_4=nil;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_1){var _elem;
var _tmp_3=nil;
_elem=_tmp_1==null?nil:_tmp_1;
_tmp_3=_result.$___lshift(nil,((_tmp_2=_block,_tmp_2!==false&&_tmp_2!==nil)?_block.$call(nil,_elem):_elem));
return _tmp_3});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==52))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$find_all:
/* Enumerable#find_all */
function(_tmp_3){var _tmp_2,self,_result,_tmp_4;
_tmp_4=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
if((_tmp_2=_tmp_3(_elem),_tmp_2!==false&&_tmp_2!==nil)){_tmp_1=_result.$___lshift(nil,_elem)}else{_tmp_1=nil};
return _tmp_1});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==53))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$map:
/* Enumerable#map */
function(_tmp_0){var _tmp_2,self,_block,_result,_tmp_4;
_tmp_4=nil;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_1){var _elem;
var _tmp_3=nil;
_elem=_tmp_1==null?nil:_tmp_1;
_tmp_3=_result.$___lshift(nil,((_tmp_2=_block,_tmp_2!==false&&_tmp_2!==nil)?_block.$call(nil,_elem):_elem));
return _tmp_3});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==54))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$to_a:
/* Enumerable#to_a */
function(){var self,_result,_tmp_2;
_tmp_2=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
_tmp_1=_result.$___lshift(nil,_elem);
return _tmp_1});
_tmp_2=_result;
return _tmp_2}

,$reject:
/* Enumerable#reject */
function(_tmp_3){var _tmp_2,self,_result,_tmp_4;
_tmp_4=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
if((_tmp_2=_tmp_3(_elem),_tmp_2===false||_tmp_2===nil)){_tmp_1=_result.$___lshift(nil,_elem)}else{_tmp_1=nil};
return _tmp_1});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==55))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$select:
/* Enumerable#select */
function(_tmp_3){var _tmp_2,self,_result,_tmp_4;
_tmp_4=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
if((_tmp_2=_tmp_3(_elem),_tmp_2!==false&&_tmp_2!==nil)){_tmp_1=_result.$___lshift(nil,_elem)}else{_tmp_1=nil};
return _tmp_1});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==56))return _tmp_5.a$return_value;
throw(_tmp_5)}}

}});$Hash = a$def_class({a$modules: [$Enumerable],a$superclass: $Object,a$methods: {$new_from_key_value_list:
/* Hash.new_from_key_value_list */
function(){var self,_obj,_list,_tmp_0;
self=this;
_list=[];
for(_tmp_0=1;_tmp_0<arguments.length;_tmp_0++)_list.push(arguments[_tmp_0]);
;
if((_tmp_0=_list.$length().$___mod(nil,2).$___eq(nil,0),_tmp_0===false||_tmp_0===nil)){self.$raise(nil,$ArgumentError)};
_obj=self.$allocate();

    // 
    // we use an associate array to store the items. But unlike
    // Javascript, the entries are arrays which contain the collisions.
    // NOTE that we have to prefix the hash code with a prefix so that
    // there are no collisions with methods etc.   
    // I prefix it for now with ":".
    //
    var items = {};
    var hashed_key, current_key, current_val;
   
    for (var i = 0; i < _list.length; i += 2)
    {
      current_key = _list[i];
      current_val = _list[i+1];
      hashed_key = ":" + current_key.$hash();

      // make sure that a bucket exists
      if (!items[hashed_key]) items[hashed_key] = [];

      items[hashed_key].push(current_key, current_val);
    }

    _obj.a$items = items; 
    _obj.a$default_value = nil;
    return _obj;
    }

,$new_from_jsobject:
/* Hash.new_from_jsobject */
function(_tmp_1,_jsobj){var self,_obj,_tmp_0;
_tmp_0=nil;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_tmp_0=_obj=self.$new();
return _tmp_0}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==65))return _tmp_2.a$return_value;
throw(_tmp_2)}}

},a$classname: "Hash",a$instance_methods: {$___at:
/* Hash#[] */
function(_tmp_0,_key){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;

    if (!self.a$items)
    {
      // this is a Javascript Object, not a RubyJS Hash object.
      // we directly look the key up. it's fast but not Ruby-like,
      // so be careful!
      
      var elem = self[_key];
      return (elem == null ? nil : elem);
    }

    var hashed_key = ":" + _key.$hash();
    var bucket = self.a$items[hashed_key];

    if (bucket)
    {
      //
      // find the matching element inside the bucket
      //

      for (var i = 0; i < bucket.length; i += 2)
      {
        if (bucket[i].$eql___quest(nil,_key))
          return bucket[i+1];
      }
    }

    // no matching key found -> return default value
    return self.a$default_value;
    }catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==57))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$keys:
/* Hash#keys */
function(){var self,_tmp_1,_tmp_3;
_tmp_1=_tmp_3=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_3=self.$map(function(_tmp_0){var _v,_k;
var _tmp_2=nil;
(_tmp_1=a$masgn_iter(_tmp_0),_k=_tmp_1[0]==null?nil:_tmp_1[0],_v=_tmp_1[1]==null?nil:_tmp_1[1],_tmp_1);
_tmp_2=_k;
return _tmp_2});
return _tmp_3}

,$collect:
/* Hash#collect */
function(_tmp_0){var _tmp_2,self,_block,_result,_tmp_4;
_tmp_4=nil;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_1){var _elem;
var _tmp_3=nil;
_elem=_tmp_1==null?nil:_tmp_1;
_tmp_3=_result.$___lshift(nil,((_tmp_2=_block,_tmp_2!==false&&_tmp_2!==nil)?_block.$call(nil,_elem):_elem));
return _tmp_3});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==58))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$to_s:
/* Hash#to_s */
function(){var _strs,self,_tmp_1,_tmp_3;
_tmp_1=_tmp_3=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_strs=[];
self.$each(function(_tmp_0){var _v,_k;
var _tmp_2=nil;
(_tmp_1=a$masgn_iter(_tmp_0),_k=_tmp_1[0]==null?nil:_tmp_1[0],_v=_tmp_1[1]==null?nil:_tmp_1[1],_tmp_1);
_strs.$___lshift(nil,_k);
_tmp_2=_strs.$___lshift(nil,_v);
return _tmp_2});
_tmp_3=_strs.$join(nil,"");
return _tmp_3}

,$___set:
/* Hash#[]= */
function(_tmp_0,_key,_value){var self;
self=this;
try{if(arguments.length!=3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
;

    if (!self.a$items)
    {
      // this is a Javascript Object, not a RubyJS Hash object.
      // we directly look the key up. it's fast but not Ruby-like,
      // so be careful!
      
      self[_key] = _value;
      return _value; 
    }

    var hashed_key = ":" + _key.$hash();
    var bucket = self.a$items[hashed_key];

    if (bucket)
    {
      //
      // find the matching element inside the bucket
      //

      for (var i = 0; i < bucket.length; i += 2)
      {
        if (bucket[i].$eql___quest(nil,_key))
        {
          // overwrite value
          bucket[i+1] = _value;
          return _value;
        }
      }
      // key not found in this bucket. append key, value pair to bucket
      bucket.push(_key, _value);
    }
    else 
    {
      //
      // create new bucket
      //
      self.a$items[hashed_key] = [_key, _value];
    }
    return _value;
    }catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==61))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$each:
/* Hash#each */
function(_tmp_0){var self;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;

    if (!self.a$items)
    {
      // this is a Javascript Object, not a RubyJS Hash object.
      // we directly look the key up. it's fast but not Ruby-like,
      // so be careful!
      var key, value;
      for (key in self)
      {
        value = self[key];;
_tmp_0([(key == null ? nil : key),(value == null ? nil : value)]);

      }
      
      return nil;
    }

    var key, bucket, i;
    for (key in self.a$items)
    {
      if (key.charAt(0) == ":")
      {
        bucket = self.a$items[key];
        for (i=0; i<bucket.length; i+=2)
        {;
_tmp_0([bucket[i],bucket[i+1]]);

        }
      }
    }
    return nil;
    }catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==60))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$initialize:
/* Hash#initialize */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;

    self.a$items = {}; 
    self.a$default_value = nil;
    return nil}

,$find_all:
/* Hash#find_all */
function(_tmp_3){var _tmp_2,self,_result,_tmp_4;
_tmp_4=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
if((_tmp_2=_tmp_3(_elem),_tmp_2!==false&&_tmp_2!==nil)){_tmp_1=_result.$___lshift(nil,_elem)}else{_tmp_1=nil};
return _tmp_1});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==59))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$values:
/* Hash#values */
function(){var self,_tmp_1,_tmp_3;
_tmp_1=_tmp_3=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_3=self.$map(function(_tmp_0){var _v,_k;
var _tmp_2=nil;
(_tmp_1=a$masgn_iter(_tmp_0),_k=_tmp_1[0]==null?nil:_tmp_1[0],_v=_tmp_1[1]==null?nil:_tmp_1[1],_tmp_1);
_tmp_2=_v;
return _tmp_2});
return _tmp_3}

,$map:
/* Hash#map */
function(_tmp_0){var _tmp_2,self,_block,_result,_tmp_4;
_tmp_4=nil;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_1){var _elem;
var _tmp_3=nil;
_elem=_tmp_1==null?nil:_tmp_1;
_tmp_3=_result.$___lshift(nil,((_tmp_2=_block,_tmp_2!==false&&_tmp_2!==nil)?_block.$call(nil,_elem):_elem));
return _tmp_3});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==62))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$to_a:
/* Hash#to_a */
function(){var self,_result,_tmp_2;
_tmp_2=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
_tmp_1=_result.$___lshift(nil,_elem);
return _tmp_1});
_tmp_2=_result;
return _tmp_2}

,$inspect:
/* Hash#inspect */
function(){var self,_str,_tmp_1,_tmp_3;
_tmp_1=_tmp_3=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_str="{";
_str=_str.$___plus(nil,self.$map(function(_tmp_0){var _v,_k;
var _tmp_2=nil;
(_tmp_1=a$masgn_iter(_tmp_0),_k=_tmp_1[0]==null?nil:_tmp_1[0],_v=_tmp_1[1]==null?nil:_tmp_1[1],_tmp_1);
_tmp_2=_k.$inspect().$___plus(nil,"=>").$___plus(nil,_v.$inspect());
return _tmp_2}).$join(nil,", "));
_str=_str.$___plus(nil,"}");
_tmp_3=_str;
return _tmp_3}

,$reject:
/* Hash#reject */
function(_tmp_3){var _tmp_2,self,_result,_tmp_4;
_tmp_4=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
if((_tmp_2=_tmp_3(_elem),_tmp_2===false||_tmp_2===nil)){_tmp_1=_result.$___lshift(nil,_elem)}else{_tmp_1=nil};
return _tmp_1});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==63))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$select:
/* Hash#select */
function(_tmp_3){var _tmp_2,self,_result,_tmp_4;
_tmp_4=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
if((_tmp_2=_tmp_3(_elem),_tmp_2!==false&&_tmp_2!==nil)){_tmp_1=_result.$___lshift(nil,_elem)}else{_tmp_1=nil};
return _tmp_1});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==64))return _tmp_5.a$return_value;
throw(_tmp_5)}}

}});$HelloWorld = a$def_class({a$modules: [],a$superclass: $Object,a$methods: {$say_hello:
/* HelloWorld.say_hello */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=self.$puts(nil,"Hello CART, from rubyjs!");
return _tmp_0}

},a$classname: "HelloWorld"});$Array = a$def_class({a$modules: [$Enumerable],a$superclass: $Object,a$methods: {$new:
/* Array.new */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return []}

},a$classname: "Array",a$object_constructor: Array,a$instance_methods: {$___plus:
/* Array#+ */
function(_tmp_0,_otherArray){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self.concat(_otherArray)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==69))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___lshift:
/* Array#<< */
function(_tmp_0,_arg){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
self.push(_arg); return self}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==68))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___eq:
/* Array#== */
function(_tmp_1,_obj){var self,_tmp_0;
_tmp_0=nil;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_tmp_0=self.$eql___quest(nil,_obj);
return _tmp_0}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==67))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$delete:
/* Array#delete */
function(_tmp_0,_obj){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;

    var del = false;
    for (var i=0; i < self.length; i++)
    {
      if (_obj.$eql___quest(nil, self[i]))
      {
        self.splice(i,1);
        del = true;
        // stay at the current index unless we are at the last element!
        if (i < self.length-1) --i; 
      }
    }
    return del ? _obj : nil}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==66))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$size:
/* Array#size */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.length}

,$___at:
/* Array#[] */
function(_tmp_0,_i){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
var v = self[_i]; return (v == null ? nil : v)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==71))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$clear:
/* Array#clear */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
self.length=0; return self}

,$eql___quest:
/* Array#eql? */
function(_tmp_4,_other){var self,_tmp_1,_tmp_3;
_tmp_3=nil;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_tmp_3=self.$each_with_index(function(_tmp_0){var _elem,_i;
var _tmp_2=nil;
(_tmp_1=a$masgn_iter(_tmp_0),_elem=_tmp_1[0]==null?nil:_tmp_1[0],_i=_tmp_1[1]==null?nil:_tmp_1[1],_tmp_1);
if((_tmp_1=_elem.$eql___quest(nil,_other.$___at(nil,_i)),_tmp_1===false||_tmp_1===nil)){throw(new a$iter_jump(false,70))}else{_tmp_2=nil};
return _tmp_2});
return _tmp_3}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==70))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$reverse:
/* Array#reverse */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.concat().reverse()}

,$collect:
/* Array#collect */
function(_tmp_0){var _tmp_2,self,_block,_result,_tmp_4;
_tmp_4=nil;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_1){var _elem;
var _tmp_3=nil;
_elem=_tmp_1==null?nil:_tmp_1;
_tmp_3=_result.$___lshift(nil,((_tmp_2=_block,_tmp_2!==false&&_tmp_2!==nil)?_block.$call(nil,_elem):_elem));
return _tmp_3});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==72))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$last:
/* Array#last */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
var v = self[self.length - 1]; return (v == null ? nil : v)}

,$to_s:
/* Array#to_s */
function(){var self,_tmp_2;
_tmp_2=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_2=self.$map(function(_tmp_0){var _i;
var _tmp_1=nil;
_i=_tmp_0==null?nil:_tmp_0;
_tmp_1=_i.$to_s();
return _tmp_1}).$join();
return _tmp_2}

,$___set:
/* Array#[]= */
function(_tmp_0,_i,_val){var self;
self=this;
try{if(arguments.length!=3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
;
return (self[_i] = _val)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==77))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$each:
/* Array#each */
function(_tmp_0){var self;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;

    var elem;
    for (var i=0; i < self.length; i++) {
      elem = self[i];;
_tmp_0((elem == null ? nil : elem));
}
    return self}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==76))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$each_with_index:
/* Array#each_with_index */
function(_tmp_0){var self;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
  
    var elem;
    for (var i=0; i < self.length; i++) {
      elem = self[i];;
_tmp_0([(elem == null ? nil : elem),i]);
}
    return self}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==75))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$first:
/* Array#first */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
var v = self[0]; return (v == null ? nil : v)}

,$include___quest:
/* Array#include? */
function(_tmp_4,_candidate){var self,_tmp_1,_tmp_3;
_tmp_3=nil;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
self.$each(function(_tmp_0){var _elem;
var _tmp_2=nil;
_elem=_tmp_0==null?nil:_tmp_0;
if((_tmp_1=_elem.$eql___quest(nil,_candidate),_tmp_1!==false&&_tmp_1!==nil)){throw(new a$iter_jump(true,74))}else{_tmp_2=nil};
return _tmp_2});
_tmp_3=false;
return _tmp_3}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==74))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$find_all:
/* Array#find_all */
function(_tmp_3){var _tmp_2,self,_result,_tmp_4;
_tmp_4=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
if((_tmp_2=_tmp_3(_elem),_tmp_2!==false&&_tmp_2!==nil)){_tmp_1=_result.$___lshift(nil,_elem)}else{_tmp_1=nil};
return _tmp_1});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==73))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$length:
/* Array#length */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.length}

,$pop:
/* Array#pop */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;

    var elem = self.pop();
    return (elem == null ? nil : elem)}

,$shift:
/* Array#shift */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;

    var elem = self.shift();
    return (elem == null ? nil : elem)}

,$map:
/* Array#map */
function(_tmp_0){var _tmp_2,self,_block,_result,_tmp_4;
_tmp_4=nil;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_1){var _elem;
var _tmp_3=nil;
_elem=_tmp_1==null?nil:_tmp_1;
_tmp_3=_result.$___lshift(nil,((_tmp_2=_block,_tmp_2!==false&&_tmp_2!==nil)?_block.$call(nil,_elem):_elem));
return _tmp_3});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==78))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$empty___quest:
/* Array#empty? */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return (self.length == 0)}

,$to_a:
/* Array#to_a */
function(){var self,_result,_tmp_2;
_tmp_2=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
_tmp_1=_result.$___lshift(nil,_elem);
return _tmp_1});
_tmp_2=_result;
return _tmp_2}

,$push:
/* Array#push */
function(){var self,_args,_tmp_0;
self=this;
_args=[];
for(_tmp_0=1;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;
self.push.apply(self, _args); return self}

,$to_ary:
/* Array#to_ary */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=self;
return _tmp_0}

,$dup:
/* Array#dup */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.concat()}

,$inspect:
/* Array#inspect */
function(){var self,_str,_tmp_2;
_tmp_2=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_str="[";
_str=_str.$___plus(nil,self.$map(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
_tmp_1=_elem.$inspect();
return _tmp_1}).$join(nil,", "));
_str=_str.$___plus(nil,"]");
_tmp_2=_str;
return _tmp_2}

,$reverse___not:
/* Array#reverse! */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
self.reverse(); return self}

,$unshift:
/* Array#unshift */
function(){var self,_args,_tmp_0;
self=this;
_args=[];
for(_tmp_0=1;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;
self.unshift.apply(self, _args); return self}

,$reject:
/* Array#reject */
function(_tmp_3){var _tmp_2,self,_result,_tmp_4;
_tmp_4=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
if((_tmp_2=_tmp_3(_elem),_tmp_2===false||_tmp_2===nil)){_tmp_1=_result.$___lshift(nil,_elem)}else{_tmp_1=nil};
return _tmp_1});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==79))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$join:
/* Array#join */
function(_tmp_4,_sep){var self,_str,_tmp_1,_tmp_3;
_tmp_3=nil;
self=this;
try{if(arguments.length>2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
if(_sep==null)_sep="";
;
_str="";
self.$each_with_index(function(_tmp_0){var _elem,_i;
var _tmp_2=nil;
(_tmp_1=a$masgn_iter(_tmp_0),_elem=_tmp_1[0]==null?nil:_tmp_1[0],_i=_tmp_1[1]==null?nil:_tmp_1[1],_tmp_1);
_str=_str.$___plus(nil,_elem.$to_s());
if((_tmp_1=_i.$___eq(nil,self.$length().$___minus(nil,1)),_tmp_1===false||_tmp_1===nil)){_tmp_2=_str=_str.$___plus(nil,_sep)}else{_tmp_2=nil};
return _tmp_2});
_tmp_3=_str;
return _tmp_3}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==81))return _tmp_5.a$return_value;
throw(_tmp_5)}}

,$select:
/* Array#select */
function(_tmp_3){var _tmp_2,self,_result,_tmp_4;
_tmp_4=nil;
self=this;
try{if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_result=[];
self.$each(function(_tmp_0){var _elem;
var _tmp_1=nil;
_elem=_tmp_0==null?nil:_tmp_0;
if((_tmp_2=_tmp_3(_elem),_tmp_2!==false&&_tmp_2!==nil)){_tmp_1=_result.$___lshift(nil,_elem)}else{_tmp_1=nil};
return _tmp_1});
_tmp_4=_result;
return _tmp_4}catch(_tmp_5){if(_tmp_5 instanceof a$iter_jump && (!_tmp_5.a$scope || _tmp_5.a$scope==80))return _tmp_5.a$return_value;
throw(_tmp_5)}}

}});$DOMElement = a$def_class({a$modules: [],a$superclass: $Object,a$methods: {$find_js_element:
/* DOMElement.find_js_element */
function(_tmp_0,_element){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return document.getElementById(_element);}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==87))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$find:
/* DOMElement.find */
function(_tmp_1,_element){var self,_dom_element,_tmp_0;
_tmp_0=nil;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_dom_element=self.$find_js_element(nil,_element);
_tmp_0=$DOMElement.$new(nil,_dom_element);
return _tmp_0}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==88))return _tmp_2.a$return_value;
throw(_tmp_2)}}

},a$classname: "DOMElement",a$instance_methods: {$___at:
/* DOMElement#[] */
function(_tmp_0,_attribute){var self,_element;
self=this;
if(self.$___ivardom_element==null)self.$___ivardom_element=nil;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_element=self.$___ivardom_element;
return _element[_attribute]}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==83))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$inner_html___eq:
/* DOMElement#inner_html= */
function(_tmp_0,_html){var self,_elem;
self=this;
if(self.$___ivardom_element==null)self.$___ivardom_element=nil;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_elem=self.$___ivardom_element;

    _elem.innerHTML = _html;
    return nil;}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==82))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___set:
/* DOMElement#[]= */
function(_tmp_1,_attr,_value){var self,_element,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivardom_element==null)self.$___ivardom_element=nil;
try{if(arguments.length!=3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
;
_element=self.$___ivardom_element;
_element[_attr] = _value;;
_tmp_0=nil;
return _tmp_0}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==85))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$initialize:
/* DOMElement#initialize */
function(_tmp_1,_element){var self,_tmp_0;
_tmp_0=nil;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_tmp_0=self.$___ivardom_element=_element;
return _tmp_0}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==84))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$observe:
/* DOMElement#observe */
function(_tmp_0,_event){var self,_block,_element,_tmp_1;
_tmp_1=nil;
self=this;
_block=_tmp_0==null?nil:_tmp_0;
if(self.$___ivardom_element==null)self.$___ivardom_element=nil;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_element=self.$___ivardom_element;

      if (_element.addEventListener) {
        _element.addEventListener(_event, _block, false);
      } else {
        _element.attachEvent("on" + _event, _block);
      }
    ;
_tmp_1=nil;
return _tmp_1}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==86))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$inner_html:
/* DOMElement#inner_html */
function(){var self,_elem;
self=this;
if(self.$___ivardom_element==null)self.$___ivardom_element=nil;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_elem=self.$___ivardom_element;

    var ret = _elem.innerHTML;
    return (ret == null) ? nil : ret;}

}});$Boolean = a$def_class({a$modules: [],a$superclass: $Object,a$classname: "Boolean",a$object_constructor: Boolean,a$instance_methods: {$___eq:
/* Boolean#== */
function(_tmp_0,_obj){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return (self == _obj)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==89))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$to_s:
/* Boolean#to_s */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return (self == true ? 'true' : 'false')}

,$inspect:
/* Boolean#inspect */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return (self == true ? 'true' : 'false')}

}});$Method = a$def_class({a$modules: [],a$superclass: $Object,a$classname: "Method",a$instance_methods: {$initialize:
/* Method#initialize */
function(_tmp_2,_object,_method_id){var self,_m,_tmp_0,_tmp_1;
_tmp_1=nil;
self=this;
try{if(arguments.length!=3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
;
(_tmp_0=[_object,_method_id],self.$___ivarobject=_tmp_0[0]==null?nil:_tmp_0[0],self.$___ivarmethod_id=_tmp_0[1]==null?nil:_tmp_0[1],_tmp_0);
_m=nil;
_m = _object[a$mm_reverse[_method_id]];
    if (_m==null) _m = nil;;
if((_tmp_0=_m,_tmp_0!==false&&_tmp_0!==nil)){_tmp_1=self.$___ivarmethod=_m}else{_tmp_1=self.$raise(nil,$NameError,("undefined method `" + ((_method_id).$to_s()) + ("' for class `") + ((_object.$class().$name()).$to_s()) + ("'")))};
return _tmp_1}catch(_tmp_3){if(_tmp_3 instanceof a$iter_jump && (!_tmp_3.a$scope || _tmp_3.a$scope==90))return _tmp_3.a$return_value;
throw(_tmp_3)}}

,$call:
/* Method#call */
function(_tmp_1){var self,_block,_args,_tmp_0;
self=this;
_block=_tmp_1==null?nil:_tmp_1;
try{_args=[];
for(_tmp_0=1;_tmp_0<arguments.length;_tmp_0++)_args.push(arguments[_tmp_0]);
;
return self.$___ivarmethod.apply(self.$___ivarobject, [_block].concat(_args))}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==91))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$inspect:
/* Method#inspect */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(self.$___ivarmethod_id==null)self.$___ivarmethod_id=nil;
if(self.$___ivarobject==null)self.$___ivarobject=nil;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=("#<Method: " + ((self.$___ivarobject.$class().$name()).$to_s()) + ("#") + ((self.$___ivarmethod_id).$to_s()) + (">"));
return _tmp_0}

}});$RuntimeError = a$def_class({a$modules: [],a$superclass: $StandardError,a$classname: "RuntimeError"});$MatchData = a$def_class({a$modules: [],a$superclass: $Object,a$classname: "MatchData",a$instance_methods: {$initialize:
/* MatchData#initialize */
function(_tmp_1,_match){var self,_tmp_0;
_tmp_0=nil;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
_tmp_0=self.$___ivarmatch=_match;
return _tmp_0}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==92))return _tmp_2.a$return_value;
throw(_tmp_2)}}

}});$TypeError = a$def_class({a$modules: [],a$superclass: $StandardError,a$classname: "TypeError"});a$def_class({a$modules: [],a$_class: $Class});$String = a$def_class({a$modules: [],a$superclass: $Object,a$classname: "String",a$object_constructor: String,a$instance_methods: {$___plus:
/* String#+ */
function(_tmp_0,_str){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return(self + _str)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==94))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$sub:
/* String#sub */
function(_tmp_0,_pattern,_replacement){var self;
self=this;
try{if(arguments.length!=3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
;
self.replace(pattern, replacement)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==93))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$___eq___neg:
/* String#=~ */
function(_tmp_0,_pattern){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;

    var i = self.search(_pattern);
    return (i == -1 ? nil : i)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==96))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$rjust:
/* String#rjust */
function(_tmp_1,_len,_pad){var self,_n,_fillstr,_tmp_0;
self=this;
try{if(arguments.length<2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
if(arguments.length>3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
if(_pad==null)_pad=" ";
;
if((_tmp_0=_pad.$empty___quest(),_tmp_0!==false&&_tmp_0!==nil)){self.$raise(nil,$ArgumentError,"zero width padding")};
_n=_len.$___minus(nil,self.$length());
if((_tmp_0=_n.$___le(nil,0),_tmp_0!==false&&_tmp_0!==nil)){return self};
_fillstr="";
while(_fillstr.length < _n) _fillstr += _pad;;
return _fillstr.$___at(nil,0,_n).$___plus(nil,self)}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==95))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$size:
/* String#size */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.length}

,$___at:
/* String#[] */
function(_tmp_1,_index,_len){var self,_tmp_0;
self=this;
try{if(arguments.length<2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
if(arguments.length>3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
if(_len==null)_len=nil;
;
if((_tmp_0=_len.$nil___quest(),_tmp_0!==false&&_tmp_0!==nil)){return self.charAt(_index) || nil}else{if((_tmp_0=_len.$___lt(nil,0),_tmp_0!==false&&_tmp_0!==nil)){return nil};
return self.substring(_index, _index+_len)}}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==98))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$ljust:
/* String#ljust */
function(_tmp_1,_len,_pad){var self,_n,_fillstr,_tmp_0;
self=this;
try{if(arguments.length<2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
if(arguments.length>3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
if(_pad==null)_pad=" ";
;
if((_tmp_0=_pad.$empty___quest(),_tmp_0!==false&&_tmp_0!==nil)){self.$raise(nil,$ArgumentError,"zero width padding")};
_n=_len.$___minus(nil,self.$length());
if((_tmp_0=_n.$___le(nil,0),_tmp_0!==false&&_tmp_0!==nil)){return self};
_fillstr="";
while(_fillstr.length < _n) _fillstr += _pad;;
return self.$___plus(nil,_fillstr.$___at(nil,0,_n))}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==97))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$split:
/* String#split */
function(_tmp_0,_str){var self;
self=this;
try{if(arguments.length!=2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
;
return self.split(_str)}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==99))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$to_s:
/* String#to_s */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=self;
return _tmp_0}

,$length:
/* String#length */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.length}

,$strip:
/* String#strip */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return self.replace(/^\s+/, '').replace(/\s+$/, '')}

,$empty___quest:
/* String#empty? */
function(){var self;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
return(self === "")}

,$gsub:
/* String#gsub */
function(_tmp_1,_pattern,_replacement){var self,_source,_result,_match,_tmp_0;
self=this;
try{if(arguments.length<2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
if(arguments.length>3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
if(_replacement==null)_replacement=nil;
;
(_tmp_0=["",self,nil],_result=_tmp_0[0]==null?nil:_tmp_0[0],_source=_tmp_0[1]==null?nil:_tmp_0[1],_match=_tmp_0[2]==null?nil:_tmp_0[2],_tmp_0);
while(_source.length > 0) {
      if (_match = _source.match(_pattern)) {
        _result += _source.slice(0, _match.index);;
if((_tmp_0=_replacement,_tmp_0!==false&&_tmp_0!==nil)){_result=_result.$___plus(nil,_replacement)}else{_result=_result.$___plus(nil,_tmp_1(_match.$first()).$to_s())};
_source = _source.slice(_match.index + _match[0].length);
      } else {
        _result += _source; _source = '';
      }
    } return _result}catch(_tmp_2){if(_tmp_2 instanceof a$iter_jump && (!_tmp_2.a$scope || _tmp_2.a$scope==101))return _tmp_2.a$return_value;
throw(_tmp_2)}}

,$index:
/* String#index */
function(_tmp_0,_substring,_offset){var self;
self=this;
try{if(arguments.length<2)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 1)'));
if(arguments.length>3)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 2)'));
if(_offset==null)_offset=0;
;

    var i = self.indexOf(_substring, _offset);
    return (i == -1) ? nil : i}catch(_tmp_1){if(_tmp_1 instanceof a$iter_jump && (!_tmp_1.a$scope || _tmp_1.a$scope==100))return _tmp_1.a$return_value;
throw(_tmp_1)}}

,$inspect:
/* String#inspect */
function(){var self,_specialChar,_escapedString;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_specialChar={
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\f': '\\f',
      '\r': '\\r',
      '\\': '\\\\'
    };;
_escapedString=self.$gsub(function(_tmp_0){var _character,_match;
_match=_tmp_0==null?nil:_tmp_0;
_character=_specialChar[_match];
return _character ? _character : 
        '\\u00' + ("0" + _match.charCodeAt().toString(16)).substring(0,2);},/[\x00-\x1f\\]/);
return ('"' + _escapedString.replace(/"/g, '\\"') + '"');}

}});$Float = a$def_class({a$modules: [],a$superclass: $Number,a$classname: "Float",a$object_constructor: Number});$NilClass = a$def_class({a$modules: [],a$superclass: $Object,a$classname: "NilClass",a$object_constructor: NilClass,a$instance_methods: {$to_f:
/* NilClass#to_f */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=0.0;
return _tmp_0}

,$nil___quest:
/* NilClass#nil? */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=true;
return _tmp_0}

,$to_s:
/* NilClass#to_s */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0="";
return _tmp_0}

,$to_i:
/* NilClass#to_i */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=0;
return _tmp_0}

,$to_a:
/* NilClass#to_a */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=[];
return _tmp_0}

,$to_splat:
/* NilClass#to_splat */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0=[];
return _tmp_0}

,$inspect:
/* NilClass#inspect */
function(){var self,_tmp_0;
_tmp_0=nil;
self=this;
if(arguments.length>1)throw($ArgumentError.$new(nil,'wrong number of arguments ('+Math.max(0,arguments.length-1).toString()+' for 0)'));
;
_tmp_0="nil";
return _tmp_0}

}});$Regexp = a$def_class({a$modules: [],a$superclass: $Object,a$classname: "Regexp",a$object_constructor: RegExp});      $Class.a$superclass = $Object;
var a$klasses = [$Kernel,$Object,$Range,$Exception,$StandardError,$NameError,$NoMethodError,$ArgumentError,$Number,$Fixnum,$Proc,$LocalJumpError,$Bignum,$Enumerable,$Hash,$HelloWorld,$Array,$DOMElement,$Boolean,$Method,$RuntimeError,$MatchData,$TypeError,$Class,$String,$Float,$NilClass,$Regexp];
a$rebuild_classes(a$klasses);
for (var i=0; i<a$klasses.length; i++) a$mm_assign(a$klasses[i]);
$HelloWorld.$say_hello.apply($HelloWorld); 