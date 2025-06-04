import{r as o,R as w}from"./react-DXRKQaLJ.js";import{R as v,u as T,a as P}from"./react-router-DQGAB0dC.js";import{c as b}from"./@remix-run-B5iXO-M-.js";/**
 * React Router DOM v6.17.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function f(e){return e===void 0&&(e=""),new URLSearchParams(typeof e=="string"||Array.isArray(e)||e instanceof URLSearchParams?e:Object.keys(e).reduce((a,t)=>{let s=e[t];return a.concat(Array.isArray(s)?s.map(r=>[t,r]):[[t,s]])},[]))}function y(e,a){let t=f(e);return a&&a.forEach((s,r)=>{t.has(r)||a.getAll(r).forEach(c=>{t.append(r,c)})}),t}const U="startTransition",S=w[U];function d(e){let{basename:a,children:t,future:s,window:r}=e,c=o.useRef();c.current==null&&(c.current=b({window:r,v5Compat:!0}));let n=c.current,[u,i]=o.useState({action:n.action,location:n.location}),{v7_startTransition:l}=s||{},m=o.useCallback(h=>{l&&S?S(()=>i(h)):i(h)},[i,l]);return o.useLayoutEffect(()=>n.listen(m),[n,m]),o.createElement(v,{basename:a,children:t,location:u.location,navigationType:u.action,navigator:n})}var R;(function(e){e.UseScrollRestoration="useScrollRestoration",e.UseSubmit="useSubmit",e.UseSubmitFetcher="useSubmitFetcher",e.UseFetcher="useFetcher",e.useViewTransitionState="useViewTransitionState"})(R||(R={}));var p;(function(e){e.UseFetchers="useFetchers",e.UseScrollRestoration="useScrollRestoration"})(p||(p={}));function E(e){let a=o.useRef(f(e)),t=o.useRef(!1),s=T(),r=o.useMemo(()=>y(s.search,t.current?null:a.current),[s.search]),c=P(),n=o.useCallback((u,i)=>{const l=f(typeof u=="function"?u(r):u);t.current=!0,c("?"+l,i)},[c,r]);return[r,n]}export{d as B,E as u};
