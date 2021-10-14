package com.orchestranetworks.ps.widget;

import com.orchestranetworks.ui.form.widget.*;

/**
 * This widget will expand the cell height for a text field (or long string) so that user can scroll
 * to see the entire value inline.
 */
public class TableCellTextScrollWidget extends BaseUISimpleCustomWidget
{

	public TableCellTextScrollWidget(
		WidgetFactoryContext context,
		Factory factory)
	{
		super(context, factory);
	}

	
	@Override
	public void write(WidgetWriter writer, WidgetDisplayContext context)
	{
		String value = (String)context.getValueContext().getValue();
		if (context.isDisplayedInTable() && value != null) {
			int cellHeight = ((Factory)this.factory).getCellHeight();
			if (cellHeight < 1)
				cellHeight = 3;
			writer.add("<p");
			writer.addSafeAttribute("style", "height: "+cellHeight+"em; width: 100%; overflow: auto; white-space: normal;");
			writer.add(">");
			writer.addSafeInnerHTML(value);
			writer.add("</p>");
		} else {
			super.write(writer, context);
		}
	}


	public static class Factory extends BaseUICustomWidgetFactory<TableCellTextScrollWidget> {
		private int cellHeight = 3;
		@Override
		public TableCellTextScrollWidget newInstance(WidgetFactoryContext context)
		{
			return new TableCellTextScrollWidget(context, this);
		}
		public int getCellHeight()
		{
			return cellHeight;
		}
		public void setCellHeight(int cellHeight)
		{
			this.cellHeight = cellHeight;
		}
	}
}
