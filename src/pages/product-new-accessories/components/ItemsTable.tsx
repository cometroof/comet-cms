import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Edit, Trash2, Package, GripVertical } from "lucide-react";
import { ProductItem } from "@/pages/product/types";

interface ItemsTableProps {
  items: ProductItem[];
  onDragEnd: (result: DropResult) => void;
  onEdit: (item: ProductItem) => void;
  onDelete: (item: ProductItem) => void;
  isDraggable?: boolean;
}

const ItemsTable = ({
  items,
  onDragEnd,
  onEdit,
  onDelete,
  isDraggable = true,
}: ItemsTableProps) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Table>
        <TableHeader>
          <TableRow>
            {isDraggable && <TableHead className="w-12"></TableHead>}
            <TableHead>Name</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Specification</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <Droppable droppableId="items">
          {(provided) => (
            <TableBody {...provided.droppableProps} ref={provided.innerRef}>
              {items.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={item.id}
                  index={index}
                  isDragDisabled={!isDraggable}
                >
                  {(provided, snapshot) => (
                    <TableRow
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={snapshot.isDragging ? "bg-muted/50" : ""}
                    >
                      {isDraggable && (
                        <TableCell {...provided.dragHandleProps}>
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {Object.entries(
                          item.spec_info as { [key: string]: string },
                        ).length < 1
                          ? "-"
                          : null}
                        {Object.entries(
                          item.spec_info as { [key: string]: string },
                        ).map(([key, value], index) => (
                          <div key={index}>
                            <span className="font-medium">{key}</span>: {value}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            title="Edit item"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item)}
                            title="Delete item"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </TableBody>
          )}
        </Droppable>
      </Table>
    </DragDropContext>
  );
};

export default ItemsTable;
