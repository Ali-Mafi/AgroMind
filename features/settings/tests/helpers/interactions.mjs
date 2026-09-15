import { localRequire } from "../../../weather/tests/helpers/load-ts.mjs";

// Run event handlers from the real component tree without a DOM dependency.
// Preserve hook slots and effect dependencies between explicit test renders.
export function interactionHooks() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const useState = (initial) => {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], (next) => {
      slots[index] = typeof next === "function" ? next(slots[index]) : next;
    }];
  };
  return {
    react: {
      ...localRequire("react"),
      useState,
      useRef: (initial) => useState(() => ({ current: initial }))[0],
      useEffect: (effect, dependencies) => {
        const index = cursor++;
        const previous = slots[index];
        if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
          effects.push(effect);
          slots[index] = dependencies;
        }
      },
    },
    render: (Component, props = {}) => {
      cursor = 0;
      effects = [];
      const tree = Component(props);
      for (const effect of effects) effect();
      return tree;
    },
  };
}

export function elements(tree) {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!tree || typeof tree !== "object" || !tree.props) return [];
  return [tree, ...elements(tree.props.children)];
}
