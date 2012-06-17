# Hypo:

Dependency Injection for JavaScript.  Simple and to the point. Usage:

    var A = function(){};
    var B = function(){};
    var C = function(a, str){
        this.a = a;
        this.message = message;
    };
    var dFactory = {
        'someValue' : 'I\'m manufactured',
        'factoryMethod' : function(a){
            return {
                'a' : a,
                'message' : this.someValue
            };
        }
    };
    var F = function(){};
    
    var definitions = {
        // Transient entity with no dependencies
        'a' : {
            'transient' : true,
            'ctor' : A
        },
        // A singleton entity with three injected
        // dependencies: the hypo instance, an entity,
        // and a plain object
        'b' : {
            'ctor' : B,
            'props' : {
                'hypo' : {'hypo' : true},
                'a' : {'entity' : 'a'},
                'obj' : {'value' : {
                    'num' : 1
                }}
            }
        },
        // A lazy singleton entity with two injected
        // constructor arguments: an entity, and a
        // simple value.
        'c' : {
            'lazy' : true,
            'ctor' : C,
            'ctorArgs' : [
                {'entity' : 'd'},
                {'value' : 'I\'m an entity!'}
            ]
        },
        // A singleton constructed by a factory.
        'd' : {
            'factory' : {
                'context' : dFactory,
                'method' : 'factoryMethod',
                'args' : [
                    {'entity': 'a'}
                ]
            }
        },
        // An abstract entity.  Abstract entities
        // cannot be instantiated, and serve as
        // parents for concrete entities
        'e' : {
            'abstract' : true,
            'props' : {
                'a' : {'entity' : 'a'}
            }
        },
        // An entity with a parent entity.  In this
        // case the parent is an abstract entity, but
        // this doesn't necessarily have to be the case.
        'f' : {
            'ctor' : F,
            'parent' : 'e'
        }
    };
    
    var hypo = new Hypo(definitions);
    
    var a = hypo.getEntity('a');
    var b = hypo.getEntity('b');
    var c = hypo.getEntity('c');
    var d = hypo.getEntity('d');
    var f = hypo.getEntity('f');