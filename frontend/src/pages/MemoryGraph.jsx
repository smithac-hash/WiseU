import React, { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { Brain, Info, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const MemoryGraph = () => {
  const svgRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await api.get('/api/insights/memory-graph');
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch memory graph:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGraphData();
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = 600;
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    svg.selectAll("*").remove(); // Clear previous render

    const container = svg.append("g");

    // Zoom setup
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });
    svg.call(zoom);

    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.edges.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(d => d.id === 'user' ? -1500 : -400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(d => d.id === 'user' ? 0.5 : 0.05))
      .force("y", d3.forceY(height / 2).strength(d => d.id === 'user' ? 0.5 : 0.05))
      .force("collision", d3.forceCollide().radius(d => (d.size || 20) + 10));

    // Arrow marker for links
    container.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#ccc")
      .style("stroke", "none");

    // Draw links
    const link = container.append("g")
      .selectAll("g")
      .data(links)
      .join("g")
      .attr("class", "link-group");

    const linkLine = link.append("line")
      .attr("stroke", "#ddd")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,2")
      .attr("marker-end", "url(#arrowhead)");

    const linkText = link.append("text")
      .attr("class", "link-label")
      .attr("font-size", "8px")
      .attr("fill", "#999")
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .style("opacity", 0) // Visible only on hover
      .text(d => d.label);

    // Draw nodes
    const node = container.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .call(drag(simulation))
      .on("mouseenter", (event, d) => {
        setHoverNode(d);
        // Show connected labels
        linkText.style("opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0);
      })
      .on("mouseleave", () => {
        setHoverNode(null);
        linkText.style("opacity", 0);
      })
      .on("click", (event, d) => {
        setSelectedNode(d === selectedNode ? null : d);
        highlightNodes(d === selectedNode ? null : d);
      });

    // Node shapes based on type
    node.each(function(d) {
      const el = d3.select(this);
      const size = d.size || 20;
      
      if (d.type === 'goal') {
        el.append("path")
          .attr("d", d3.symbol().type(d3.symbolStar).size(size * 30))
          .attr("fill", "#EF9F27");
      } else if (d.type === 'summary') {
        el.append("path")
          .attr("d", d3.symbol().type(d3.symbolDiamond).size(size * 30))
          .attr("fill", "#1D9E75");
      } else if (d.type === 'budget') {
        el.append("rect")
          .attr("width", size * 3)
          .attr("height", size * 1.2)
          .attr("x", -(size * 1.5))
          .attr("y", -(size * 0.6))
          .attr("rx", 6)
          .attr("fill", "#1D9E75")
          .style("opacity", 0.9);
      } else if (d.type === 'user') {
        el.append("circle")
          .attr("r", size)
          .attr("fill", "#534AB7")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.1))");
        el.append("text")
          .text(d.label.charAt(0))
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .style("fill", "white")
          .style("font-weight", "black")
          .style("pointer-events", "none")
          .style("font-size", `${size}px`);
      } else {
        const opacity = d.type === 'expense' ? Math.max(0.4, Math.min(1, d.amount / 5000)) : 1;
        el.append("circle")
          .attr("r", size / 2)
          .attr("fill", d.type === 'expense' ? "#534AB7" : "#94a3b8")
          .style("opacity", opacity);
      }
    });

    // Node labels (visible for non-user/non-expense nodes)
    node.filter(d => d.type !== 'user' && d.type !== 'expense')
      .append("text")
      .text(d => d.label)
      .attr("y", d => (d.size || 20) + 10)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "600")
      .style("fill", "#666")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      linkLine
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      linkText
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    function highlightNodes(target) {
      if (!target) {
        node.style("opacity", 1);
        linkLine.style("opacity", 0.6);
        return;
      }
      
      const connectedNodeIds = new Set();
      connectedNodeIds.add(target.id);
      
      links.forEach(l => {
        if (l.source.id === target.id) connectedNodeIds.add(l.target.id);
        if (l.target.id === target.id) connectedNodeIds.add(l.source.id);
      });

      node.style("opacity", d => connectedNodeIds.has(d.id) ? 1 : 0.1);
      linkLine.style("opacity", l => (l.source.id === target.id || l.target.id === target.id) ? 1 : 0.05);
    }

  }, [data]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[600px] bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-gray-500 font-medium">Visualizing {data?.userName || 'your'} financial ecosystem...</p>
    </div>
  );

  const isEmpty = !data || data.nodes.length === 0;
  const expenseCount = data?.nodes?.filter(n => n.type === 'expense').length || 0;
  const budgetCount = data?.nodes?.filter(n => n.type === 'budget').length || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Brain className="text-primary w-6 h-6" />
            </div>
            {data?.userName || 'Your'} Financial Memory Graph
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm font-bold text-gray-400">
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> {expenseCount} transactions</span>
             <span>•</span>
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1D9E75]"></span> {budgetCount} budgets tracked</span>
             <span>•</span>
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> {data?.totalMemories || 0} AI memories stored</span>
          </div>
        </div>
        {!isEmpty && (
           <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm text-xs font-black uppercase tracking-tighter text-gray-400 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Membrain Active
           </div>
        )}
      </div>

      <div className="relative bg-[#f8fafc] rounded-3xl shadow-2xl border border-gray-200 overflow-hidden group min-h-[600px] flex items-center justify-center">
        {isEmpty ? (
          <div className="text-center p-12 max-w-md">
             <h3 className="text-xl font-bold text-gray-800 mb-2">No Memories Found Yet</h3>
             <a href="/insights" className="mt-4 inline-block bg-primary text-white py-3 px-8 rounded-xl font-bold">✨ Generate Memories</a>
          </div>
        ) : (
          <>
            <div className="absolute top-6 left-6 z-10">
                <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-gray-100 shadow-xl flex flex-col gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-[#534AB7] border-2 border-white shadow-sm"></span> User / Expense</div>
                    <div className="flex items-center gap-3"><span className="w-4 h-4 flex items-center justify-center text-[#EF9F27]">★</span> Savings Goal</div>
                    <div className="flex items-center gap-3"><span className="w-4 h-2 rounded-sm bg-[#1D9E75] opacity-80"></span> Budget</div>
                    <div className="flex items-center gap-3"><span className="w-3 h-3 rotate-45 bg-[#1D9E75]"></span> Summary</div>
                    <div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-[#94a3b8]"></span> Income Profile</div>
                </div>
            </div>

            <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
                <button className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-100 hover:bg-white text-gray-800 transition-all hover:scale-110 active:scale-95" title="Graph Interaction Info">
                    <Info className="w-5 h-5" />
                </button>
            </div>

            <svg ref={svgRef} className="w-full h-[600px] cursor-grab active:cursor-grabbing"></svg>

            {/* Tooltip */}
            {hoverNode && (
              <div className="absolute pointer-events-none bg-gray-900/95 backdrop-blur-xl text-white p-5 rounded-2xl shadow-2xl max-w-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-300" 
                  style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-white/10">
                        {hoverNode.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">{hoverNode.date || 'Metadata'}</span>
                </div>
                
                <h4 className="text-lg font-black mb-1">{hoverNode.category || hoverNode.label}</h4>
                {hoverNode.note && <p className="text-xs text-gray-400 mb-3 italic">"{hoverNode.note}"</p>}
                
                {hoverNode.type === 'expense' && (
                    <div className="text-3xl font-black text-white">₹{hoverNode.amount}</div>
                )}
                {hoverNode.type === 'budget' && (
                    <div className="text-xs font-bold text-green-400">Target Monthly Limit</div>
                )}
              </div>
            )}

            {/* Hint */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur px-6 py-2 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 shadow-lg">
                    Drag nodes • Scroll to zoom • Click to focus connections
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MemoryGraph;
