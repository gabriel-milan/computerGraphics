/*
 *	Control stuff (Edited from Three.js DragControls)
 */

THREE.Controls = function ( _objects, _camera, _domElement, _scene ) {

	// Defaults
    if ( _objects instanceof THREE.Camera ) {
		console.warn( 'THREE.Controls: Constructor now expects ( objects, camera, domElement )' );
		var temp = _objects; _objects = _camera; _camera = temp;
	}

	// Scene variables
	var _plane = new THREE.Plane();
	var _raycaster = new THREE.Raycaster();

	// Highlight sphere
	var highlightSphere;

	// Control variables
	var _mouse = new THREE.Vector2();
	var mouseX = 0, mouseY = 0;
	var _mousePressed = false;
	var _worldPosition = new THREE.Vector3();
	var _hovered = null;
	var _rotationSelected = false;
	var _rotationObject = null;
	var _draggingSelected = false;
	var _offset = new THREE.Vector3();
	var _intersection = new THREE.Vector3();
	var _inverseMatrix = new THREE.Matrix4();

	// Setting scope
	var scope = this;

    // Activation: create event listeners
	function activate() {
		_domElement.addEventListener( 'mousemove', onMouseMoving, false );
		_domElement.addEventListener( 'mousedown', onMouseClicked, false );
		_domElement.addEventListener( 'mouseup', onMouseCancel, false );
		_domElement.addEventListener( 'mouseleave', onMouseCancel, false );
		_domElement.addEventListener( 'dblclick', onMouseDoubleClick, false );
		highlightSphere = new THREE.Mesh(
			new THREE.SphereGeometry(60, 360, 360, 0, Math.PI * 2, 0, Math.PI * 2),
			new THREE.MeshLambertMaterial({
				emissive: 0x111111,
				transparent: true,
				opacity: 0.5
			})
		);
		highlightSphere.visible = false;
		_scene.add(highlightSphere);
	}

    // Deactivation: removes event listeners
	function deactivate() {
		_domElement.removeEventListener( 'mousemove', onMouseMoving, false );
		_domElement.removeEventListener( 'mousedown', onMouseClicked, false );
		_domElement.removeEventListener( 'mouseup', onMouseCancel, false );
		_domElement.removeEventListener( 'mouseleave', onMouseCancel, false );
		_domElement.removeEventListener( 'dblclick', onMouseDoubleClick, false );
	}

	function dispose() {
		deactivate();
    }
    
    /*
     *  Event handlers
     */

    // Mouse is moving
    function onMouseMoving (event) {

        // Defaults
		event.preventDefault();

		// Get mouse coordinates
		var rect = _domElement.getBoundingClientRect();
		_mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
		_mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

		// Setting raycaster
		_raycaster.setFromCamera( _mouse, _camera );

		// Getting intersections
		var intersects = _raycaster.intersectObjects( _objects );

		// Getting mouse movement
        var deltaX = event.clientX - mouseX,
            deltaY = event.clientY - mouseY;
        mouseX = event.clientX;
        mouseY = event.clientY;

		// If an object's been selected, drag it
		if ( _hovered && scope.enabled ) {

			if (_draggingSelected) {
				if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {
					_hovered.position.copy( _intersection.sub( _offset ).applyMatrix4( _inverseMatrix ) );
				}

				scope.dispatchEvent( { type: 'dragstart', object: _hovered } );

				return;
			}
			else if (_rotationSelected && _rotationObject == _hovered && _mousePressed) {
				scope.dispatchEvent( { type: 'dragstart', object: _hovered } );

				// Rotate this object
				_rotationObject.rotation.y += deltaX / 100;
				_rotationObject.rotation.x += deltaY / 100;
			}
		}

		// If mouse is over objects, sets pointer and hovered object
		if ( intersects.length > 0 ) {
			var object = intersects[ 0 ].object;
			_plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), _worldPosition.setFromMatrixPosition( object.matrixWorld ) );

			if ( _hovered !== object ) {
				scope.dispatchEvent( { type: 'hoveron', object: object } );

				_domElement.style.cursor = 'pointer';
				_hovered = object;
			}
		}
		else {

			if ( _hovered !== null ) {
				scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );

				_domElement.style.cursor = 'auto';
				_hovered = null;
			}
		}

        // Log it
        console.log("Mouse is moving...");
    }

    // Mouse is pressed
    function onMouseClicked (event) {

        // Defaults
		event.preventDefault();
		
		// Sets mouse pressed
		_mousePressed = true;

		// Checks if there's a hovered object
		if (_hovered) {

			// Checks if it's rotation mode
			if (_rotationSelected) {

				// Rotation mode
				_draggingSelected = false;
			}
			else {

				// Drag object
				if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {
					_inverseMatrix.getInverse( _hovered.parent.matrixWorld );
					_offset.copy( _intersection ).sub( _worldPosition.setFromMatrixPosition( _hovered.matrixWorld ) );
				}
	
				// Set cursor and stop screen control
				_domElement.style.cursor = 'move';
				scope.dispatchEvent( { type: 'dragstart', object: _hovered } );

				// Set dragging as selected
				_draggingSelected = true;
			}
		}

        // Log it
        console.log("Mouse is pressed...");
    }

    // Mouse is up or left
    function onMouseCancel (event) {

        // Defaults
		event.preventDefault();
		
		// Sets mouse pressed
		_mousePressed = false;

		// Stops dragging
		_draggingSelected = false;
		scope.dispatchEvent( { type: 'dragend', object: _hovered } );

        // Log it
        console.log("Mouse is canceled...");
    }

    // Mouse double-clicked
    function onMouseDoubleClick (event) {

        // Defaults
		event.preventDefault();
		
		// Checks for hover
		if ( _hovered !== null ) {
			highlightSphere.position.copy(_hovered.position);
			highlightSphere.scale.copy(_hovered.scale);
			highlightSphere.visible = true;
			_rotationSelected = true;
			_rotationObject = _hovered;
		}
		else {
			highlightSphere.visible = false;
			_rotationSelected = false;
			_rotationObject = null;
		}

        // Log it
        console.log("Mouse double-clicked...");
    }

	// Starting things
	activate();

	// API
	this.enabled = true;
	this.activate = activate;
	this.deactivate = deactivate;
	this.dispose = dispose;

	// Backward compatibility stuff
	this.setObjects = function () {
		console.error( 'THREE.Controls: setObjects() has been removed.' );
	};
	this.on = function ( type, listener ) {
		console.warn( 'THREE.Controls: on() has been deprecated. Use addEventListener() instead.' );
		scope.addEventListener( type, listener );
	};
	this.off = function ( type, listener ) {
		console.warn( 'THREE.Controls: off() has been deprecated. Use removeEventListener() instead.' );
		scope.removeEventListener( type, listener );
	};
	this.notify = function ( type ) {
		console.error( 'THREE.Controls: notify() has been deprecated. Use dispatchEvent() instead.' );
		scope.dispatchEvent( { type: type } );
	};

};

THREE.Controls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.Controls.prototype.constructor = THREE.Controls;
