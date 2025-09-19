import React, { useState, useEffect, useRef } from "react";
import SubtaskNode from "./SubtaskNode";
import SubtaskLine from "./SubtaskLine";
import "./SubtaskMindmap.css";

const CENTER_NODE_ID = "center";

function SubtaskMindmap({
    project, 
    positions, 
    onSubtaskClick, 
    onAddSubtask, 
    onEditSubtask, 
    onDeleteSubtask, 
    onPositionChange, 
    onCanvasResize //캔버스 사이즈 전달
}) {
  const [showForm, setShowForm] = useState(false);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState(null);
  const [size, setSize] = useState({ width: 0, height: 0 });


  //캔버스 크기 추적
  const canvasRef = useRef(null); // DOM 태그 직접 참조

  useEffect(() => {
    if (!canvasRef.current) return;
    // 특정 DOM 요소의 크기 변화 감지 -> width, height 추출 
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
      onCanvasResize(width, height); // 부모(ProjectDetail)에 크기 전달
    });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [onCanvasResize]);

  //노드 데이터 생성 
  const generateNodes = (width, height) => {
    const center = {
      id: CENTER_NODE_ID,
      label: project.title,
      x: width / 2,
      y: height / 2,
      isCenter: true,
      priority: project.priority,
      progress: project.progress
    };

    const subtaskNodes = project.subtasks.map(subtask => {
      const position = positions[subtask.id] || { x: 400, y: 250, radius: 55 };
      return {
        id: subtask.id,
        label: subtask.title,
        x: position.x,
        y: position.y,
        radius: position.radius,
        isCenter: false,
        priority: subtask.priority,
        progress: subtask.progress,
        data: subtask
      };
    });

    return [center, ...subtaskNodes];
  };

  //연결선 데이터 생성 
  const generateEdges = () => {
    return project.subtasks.map(subtask => ({
      id: `edge-${subtask.id}`,
      from: CENTER_NODE_ID,
      to: subtask.id
    }));
  };

  // 노드, 엣지 생성
  const nodes = generateNodes(size.width, size.height);
  const edges = generateEdges();

  // 노드 위치 가져오기
  const getNodePosition = (node) => {
    if (node.isCenter) {
      return {
        x: node.x + mapOffset.x,
        y: node.y + mapOffset.y
      };
    }
    return {
      x: node.x + mapOffset.x,
      y: node.y + mapOffset.y
    };
  };

  // 노드 이동 처리 
  const handleNodeMove = (nodeId, x, y) => {
    if (nodeId === CENTER_NODE_ID) return; // 중심 노드는 이동 불가
    
    // 맵 오프셋을 고려한 실제 위치 계산
    const actualX = x - mapOffset.x;
    const actualY = y - mapOffset.y;
    
    onPositionChange(nodeId, actualX, actualY);
  };

  // 노드 클릭 처리 
    const handleNodeClick = (node) => {
    if (node.isCenter) return; // 중심 노드는 클릭 불가
    onSubtaskClick(node.data);
  };

  // 맵 드래그 처리
  const handleMapMouseDown = (e) => {
    if (e.target.closest('.subtask-node')) return;
    
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };
  const handleMapMouseMove = (e) => {
    if (!isDragging || !lastMousePos) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    setMapOffset(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };
  const handleMapMouseUp = () => {
    setIsDragging(false);
    setLastMousePos(null);
  };

    // 전역 마우스 이벤트
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMapMouseMove);
      document.addEventListener('mouseup', handleMapMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMapMouseMove);
      document.removeEventListener('mouseup', handleMapMouseUp);
    };
  }, [isDragging, lastMousePos]);

  return (
        
        <div className="main-content">
            {/* 프로젝트 정보 */}
            <article className="main-content--info">
                <span className="bold">과탑되기</span>의 세부 프로젝트 :
                <span className="bold">코딩테스트 매일 풀기</span>
                <span className="date-range">2025.10.21까지</span>
                <span></span>
            </article>
            {/* 마인드맵 */}
            <div 
                ref={canvasRef}
                className = "main-content--mindmap"
                onMouseDown = {handleMapMouseDown}
                style={{
                    cursor:isDragging ? 'grabbing' : 'grab',
                    userSelect: isDragging ? 'none' : 'auto'
                }}
            >
                {/* 연결선 */}
                {edges.map(edge => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;
                    return (
                        <SubtaskLine
                            key={edge.id}
                            from={getNodePosition(fromNode)}
                            to={getNodePosition(toNode)}
                        />
                    );
                })}

                {/* 노드 */}
                {nodes.map(node => (
                    <SubtaskNode
                        key={node.id}
                        node={{...node, ...getNodePosition(node)}}
                        onMove={handleNodeMove}
                        onClick={()=>handleNodeClick(node)}
                        onEdit={node.isCenter ? null : () => onEditSubtask(node.data)}
                        onDelete={node.isCenter ? null : () => onDeleteSubtask(node.id)}
                    />
                ))}
            </div>
        </div>
  );
};


export default SubtaskMindmap;