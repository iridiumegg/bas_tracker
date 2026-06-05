import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home.jsx";
import ProjectPage from "./ProjectPage.jsx";
import ChecklistPage from "./ChecklistPage.jsx";
import { PROJECTS } from "./projects/index.js";

export default function App() {
  return (
    <BrowserRouter basename="/bas_tracker">
      <Routes>
        <Route path="/" element={<Home />} />
        {PROJECTS.map(({ meta, items }) => (
          <Route
            key={meta.id}
            path={`/${meta.id}`}
            element={
              meta.type === "checklist"
                ? <ChecklistPage meta={meta} items={items} />
                : <ProjectPage meta={meta} items={items} />
            }
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
