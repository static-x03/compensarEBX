package com.orchestranetworks.ps.constraint;

import java.util.*;

import com.orchestranetworks.instance.*;
import com.orchestranetworks.ps.util.*;
import com.orchestranetworks.schema.*;

/**
 * When a field in a table represents a dynamic foreign key, where the referenced table is dynamic and is
 * specified in another field or a path (fk or association multi-hop), this constrain enumeration allows you
 * select a record in that foreign table.
 */
public class RecordInTableConstraintEnumeration extends AbstractRecordInTableConstraintEnumeration
{
	private Path tableField;
	private String pathsAsString;
	private Path[] paths;

	public Path getTableField()
	{
		return tableField;
	}

	public void setTableField(Path tableField)
	{
		this.tableField = tableField;
	}

	public String getPathToTableField()
	{
		return pathsAsString;
	}

	public void setPathToTableField(String pathsAsString)
	{
		this.pathsAsString = pathsAsString;
	}

	@Override
	public void setup(ConstraintContext context)
	{
		SchemaNode node = context.getSchemaNode();
		SchemaNode root = node.getTableNode().getTableOccurrenceRootNode();
		if (pathsAsString != null)
		{
			List<Path> pathList = PathUtils.convertStringToPathList(pathsAsString, null);
			List<SchemaNode> nodes = PathUtils.validatePath(root, pathList);
			if (nodes.size() < pathList.size())
			{
				context.addError("Path " + pathList.get(nodes.size()).format() + " not found.");
			}
			tableField = pathList.remove(pathList.size() - 1);
			if (!pathList.isEmpty())
			{
				this.paths = pathList.toArray(new Path[0]);
				this.paths[0] = Path.PARENT.add(this.paths[0]);
			}
			if (tableField == null)
				context.addError("TableField or PathToTableField is required");
		}
		else
		{
			if (tableField == null)
				context.addError("TableField is required");
			SchemaNode tableFieldNode = root.getNode(tableField);
			if (tableFieldNode == null)
				context.addError("Field " + tableField.format() + " not found.");
		}
	}

	public Path getTablePath(ValueContext context)
	{
		if (paths == null)
			return Path.parse(
				(String) context
					.getValue(PathUtils.getRelativePathFromFieldContext(context, tableField)));
		else
			return Path.parse(
				(String) CollectionUtils
					.getFirstOrNull(AdaptationUtil.evaluatePath(context, paths, tableField, true)));
	}

}
