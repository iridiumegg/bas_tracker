import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home.jsx";
import ProjectPage from "./ProjectPage.jsx";
import { PROJECTS } from "./projects/index.js";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {PROJECTS.map(({ meta, items }) => (
          <Route
            key={meta.id}
            path={`/${meta.id}`}
            element={<ProjectPage meta={meta} items={items} />}
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
