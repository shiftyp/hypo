!function (define) {

    define('Hypo', function(){
        
        /**
         * Hypo dependency injection framework constructor.
         *
         * @class Hypo
         * @constructor
         * @param definitions {object} An object that defines the entities
         * and their dependencies to be managed by this Hypo instance. See
         * readme for a full example of a hypo configuration object.
         **/
        var Hypo = function(definitions){
            /**
             * The entity definition object for this Hypo instance.
             *
             * @property definitions
             * @type {object}
             **/
            this.definitions = definitions;
            /**
             * A map of all singleton entities managed by this instance.
             *
             * @property singletonMap   
             * @type {object}
             **/
            this.singletonMap = {};
            this.generateSingletons();
        };
        
        Hypo.prototype = {
            /**
             * Custom error constructor for framework specific errors
             *
             * @property HypoError
             * @type {function}
             **/
            HypoError : function(){
                var err = function(message){
                    this.name = 'HypoError';
                    this.message = message;
                }
                err.prototype = new Error();
                return err;
            }(),
            /**
             * Generates the non-lazy singleton entities managed by this instance.
             * This method is called when the hypo instance is constructed, and does
             * not need to be called again.
             *
             * @method generateSingletons
             * @return {void}
             **/
            generateSingletons : function(){
                var def;
                for(var name in this.definitions)
                    if(this.definitions.hasOwnProperty(name)){
                        def = this.definitions[name];
                        if(!def.transient && !def.lazy && !def.abstract)
                            this.getEntity(name);
                    }
            },
            /**
             * The method for retrieving entities.  If an entity is a singleton
             * and not particularly lazy, it will have been created along with
             * the Hypo instance.  Otherwise, it will be created the first time
             * it is requested in the case of lazy singletons, and each time in
             * the case of transient entities.
             *
             * @method getEntity
             * @param name {string} Corresponds to the key in definitions
             * representing the entity definition to retieve an instance of.
             * @return {object} The entity instance generated from the definition
             * corresponding with the passed name.
             **/
            getEntity : function(name){
                var def = this.parseDefinition(name),
                parentDef, entity, args, i, ctor, context;
                if(def.abstract)
                    throw new this.HypoError('"' + name + '" is an abstract entity, and cannot be retrieved.');
                if(!def.transient && this.singletonMap[name])
                    entity = this.singletonMap[name];
                else{
                    if(def.ctor){
                        ctor = def.ctor
                        args = def.args;
                    }
                    else if(def.factory){
                        context =
                            typeof def.factory.context == 'string' ?
                            this.getEntity(def.factory.context) :
                            def.factory.context;
                        ctor = context[def.factory.method];
                        args = def.factory.args;
                    }
                    else
                        throw new this.HypoError('Non-abstract entity "' + name + '" must have a ctor or factory defined.');
                    entity = this.createEntity(ctor, args, name, context);
                    if(!def.transient)
                        this.singletonMap[name] = entity;
                    this.applyProperties(entity, def.props)
                }
                
                return entity;
            },
            /**
             * Creates a new object using the passed constructor function and
             * argument property definitions.  See parseProperty for a description
             * of appropriate Hypo property definitions.
             *
             * @method createEntity
             * @param ctor {function} The constructor function to be
             * invoked with the parsed argument definitions.
             * @param argDefs {array} An array of Hypo property definitions
             * @param entityName {string} The name of the entity being constructed;
             * used to check for circular dependencies.
             * @param context {object} The context in which to call the constructor;
             * used when applying factory methods.
             **/
            createEntity : function(ctor, argDefs, entityName, context){
                var entity = function(){},
                args = [],
                self = this,
                entityDef, ret, inst, i, j;
                
                function findCircularDependencies(checkDefs){
                    if(checkDefs)
                    for(i=0; i<checkDefs.length; i++){
                        // Check for circular dependencies
                        if(checkDefs[i].entity){
                            var depError = new self.HypoError(
                                'Circular dependency between "' +
                                entityName + '" and "' + checkDefs[i].entity + '".'
                            );
                            if(checkDefs[i].entity == entityName)
                                throw depError;
                            entityDef = self.definitions[checkDefs[i].entity];
                            if(entityDef.factory){
                                if(entityDef.factory.context == entityName)
                                    throw depError;
                                if(entityDef.factory.args)
                                    findCircularArguments(entityDef.factory.args);
                            }
                            if(entityDef.args){
                                findCircularDependencies(entityDef.args);
                            }
                        }
                    }
                }
                
                if(typeof ctor != 'function')
                    throw new this.HypoError('Invalid ctor or factory method for "' + entityName + '".'); 
                if(argDefs){
                    findCircularDependencies(argDefs);
                    for(i=0; i<argDefs.length; i++)
                        args.push(this.parseProperty(argDefs[i]));
                }
                if(context)
                    ret = ctor.apply(context, args);
                else{
                    entity.prototype = ctor.prototype;
                    inst = new entity();
                    ret = ctor.apply(inst, args) || inst;
                }
                
                return ret;
            },
            /**
             * Applies properties to an entity instance based on the passed set of
             * property definitions.  See parseProperty for a description of
             * appropriate Hypo property definitions.
             *
             * @method applyProperties
             * @param entity {object} An entity instance to apply the parsed properties to.
             * @param propertyDefinitions  {object} An object with keys corresponding to
             * the properties to be applied to the entity, and Hypo property definition
             * values.
             **/
            applyProperties : function(entity, propertyDefinitions){
                if(propertyDefinitions)
                    for(var prop in propertyDefinitions)
                        if(propertyDefinitions.hasOwnProperty(prop))
                            entity[prop] = this.parseProperty(propertyDefinitions[prop]);
            },
            /**
             * Parses Hypo property definitions.  These definitions are used for
             * constructor arguments, factory arguments, and property definitions.
             * Valid property objects are as follows:
             * 
             * @example
             * Passing an object with a hypo key returns a reference to the Hypo instance
             * 
             *     {
             *         hypo : true    
             *     }
             *       
             * Passing an object with an entity key equal to an entity name returns an entity
             * instance.
             * 
             *     {
             *         entity : "entity name"
             *     }
             *       
             * Passing an object with a key "value" returns that value.
             * 
             *     {
             *         value : "object or primitive value"
             *     }
             *       
             * Any other object configuration will result in an error being thrown.
             *
             * @method parseProperty
             * @param prop {object} A valid Hypo property definition
             * @returns An entity, hypo instance, or value based on the passed property 
             **/
            parseProperty : function(propDef){
                var propError = new this.HypoError('Invalid property or ctor argument definition.'),
                ret;
                if(!propDef)
                    throw propError
                if(propDef.hasOwnProperty('hypo'))
                    ret = this;
                else if(propDef.hasOwnProperty('entity'))
                    ret = this.getEntity(propDef.entity);
                else if(propDef.hasOwnProperty('value'))
                    ret = propDef.value;
                else
                    throw propError
                    
                return ret;
            },
            /**
             * Parses the definition for the passed name, including recursing through
             * any parent definitions, and merging parent and child properties where
             * needed.
             *
             * @method parseDefinition
             * @param name {string} Then entity name to parse
             * @return {object} The parsed definition
             **/
            parseDefinition : function(name){
                var def = this.definitions[name],
                key, propKey, defProps, parentProps;
                
                if(!def)
                    throw new this.HypoError('Hypo Error: Invalid entity name + "' + name + '".');
                if(def.parent && !def.parsed){
                    parent = this.parseDefinition(def.parent);
                    for(key in parent)
                        if(
                            key != 'abstract' &&
                            key != 'parsed' &&
                            parent.hasOwnProperty(key) &&
                            (key == 'props' || !def.hasOwnProperty(key))
                        ){
                            if(key == 'props' && def.hasOwnProperty('props')){
                                defProps = def.props;
                                parentProps = parent.props;
                                
                                for(propKey in parentProps){
                                    if(
                                        parentProps.hasOwnProperty(propKey) &&
                                        !defProps.hasOwnProperty(propKey)
                                    )
                                        defProps[propKey] = parentProps[propKey];
                                }
                            }
                            else
                                def[key] = parent[key];
                        }
                }
                def.parsed = true;
                return def;
            }
        };
        
        return Hypo;
    });
}(
    typeof define === 'function' && define.amd ? define :
    typeof module !== 'undefined' && module.exports ? function(id, factory){module.exports = factory()} :
    function (id, factory) {window[id] = factory()}
);