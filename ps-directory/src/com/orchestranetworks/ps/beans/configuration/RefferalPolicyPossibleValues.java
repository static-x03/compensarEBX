package com.orchestranetworks.ps.beans.configuration;

import com.orchestranetworks.ps.ui.annotations.*;

public class RefferalPolicyPossibleValues extends PossibleValues
{

	@Override
	public void initValues()
	{
		add(EnumerationValue.valueOf("follow them", "follow"));
		add(EnumerationValue.valueOf("ignore them", "ignore"));
		add(EnumerationValue.valueOf("raise an error", "throw"));
	}

}
