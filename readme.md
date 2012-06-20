# Hypo:

Dependency Injection for JavaScript: Simple and to the point.  Hypo is inspired by Spring,
and it's single xml configuration file that clearly outlines all the "beans" in your application
and their dependencies.  In Hypo you create a configuration object that defines your "entities"
and their dependencies all in one place, and retrieve them from the hypo instance.  Hypo supports
all sorts of spring features, like transient entities, lazy entities, abstract entities, parent
entities, and factories. 

## Sample Usage:

```javascript
// First, create some constructors

var A = function(){};
var B = function(){};
var C = function(a, str){
    this.a = a;
    this.str = str;
};
var Factory = function(message){
    this.factoryMethod = function(a){
        return {
            'a' : a,
            'message' : message
        };
    }
};
var F = function(){};

// Then define your "entities" in a simple configuration object
// similar to the xml configuration file in spring.

var definitions = {
    // Transient entity with no dependencies.  Transient
    // entities are created each time you request them.
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
    // simple value.  Lazy entities are created
    // the first time you request them, or they
    // are requested as a dependency of another
    // entity.
    'c' : {
        'lazy' : true,
        'ctor' : C,
        'args' : [
            {'entity' : 'd'},
            {'value' : 'I\'m an entity!'}
        ]
    },
    // Another singleton, to be used later as
    // a factory
    'factory' : {
        'ctor' : Factory,
        'args' : [
            {'value' : 'I\'m manufactured!'}
        ]
    },
    // A singleton constructed by a factory.
    // the factory context is a string which
    // references an entity, but it could also
    // be a reference to an object
    'd' : {
        'factory' : {
            'context' : 'factory',
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
    // Child entities inherit the configuration of
    // the parent entity, and can override any
    // configuration option.  Properties from the
    // parent are merged with properties from the
    // child entity.
    'f' : {
        'ctor' : F,
        'parent' : 'e',
        'props' : {
            'b' : {'entity': 'b'}
        }
    }
};
// Now create the Hypo instance with the definitions object
var hypo = new Hypo(definitions);
// And retrieve your entities as needed
var a = hypo.getEntity('a');
var b = hypo.getEntity('b');
var c = hypo.getEntity('c');
var d = hypo.getEntity('d');
var f = hypo.getEntity('f');
```

## Development

To build hypo you need to install [nodejs](http://nodejs.org/).  Then
run:

    npm install -d
    
To install the build dependencies.  Then you can run

    node build compile

To compile the source, and

    node build docs
    
To build the api documentation.  To run the unit tests, navigate to the
test.html file under tests, and the unit tests will be run and the results
displayed automatically.

## License

Copyright (c) Ryan Lynch 2012

Hypo is released under the [MIT license](http://www.opensource.org/licenses/mit-license.php).