package com.orchestranetworks.ps.cache;

import java.util.*;

import com.orchestranetworks.service.*;

public class CachedUser extends CachedObject
{
	private final UserReference userReference;
	private final String login;
	private final String password;

	public CachedUser(
		long expiration,
		boolean external,
		UserReference userReference,
		String login,
		String password)
	{
		super(expiration, external);
		this.userReference = userReference;
		this.login = login;
		this.password = password;
	}

	public UserReference getUserReference()
	{
		return userReference;
	}

	public String getLogin()
	{
		return login;
	}

	public boolean checkPassword(String password)
	{
		return Objects.equals(this.password, password);
	}
}