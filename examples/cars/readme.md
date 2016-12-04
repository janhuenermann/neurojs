![Screen-capture of cars](images/live.gif)

# Advanced car demo
This is a car demo, that shows the capabilities of neurojs. It shows it successfully can converge to a control policy, that not only can avoid objects and obstacles, but can avoid other cars. 

Through a series of sensors, cars can perceive their environment and can then respond to it.

The cars are controlled via an **continuous action space**, which is learned via an **actor-critic model**, which in this case is only 2-dimensional. One control for throttle (-1 brake, +1 forward thrust) and one for steering (-1 left, +1 right).

**Exploration is done by dropout**, which shows very promising results. It drops-out the last layer of the actor.

The **replay buffer prioritises** experiences with higher error rates.

_More info on the index page._

# Features
- Save/load a car brain as/from binary data
- Click & drag map generation
- Advanced machine learning (see neurojs features)
- Robust physics engine
- Fast WebGL renderer

## Future
- Path tracking (each car pulls a line behind, little bit like TRON)
- Tablet support
- Save/load a map as/from binary data
- Performance & cognitive analysis (with visual focus)
