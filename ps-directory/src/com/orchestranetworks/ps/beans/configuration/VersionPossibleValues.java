package com.orchestranetworks.ps.beans.configuration;

import com.orchestranetworks.ps.ui.annotations.*;

public class VersionPossibleValues extends PossibleValues
{

	@Override
	public void initValues()
	{
		add(EnumerationValue.valueOf("2"));
		add(EnumerationValue.valueOf("3"));
	}

}
