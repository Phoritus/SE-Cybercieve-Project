#include <bits/stdc++.h>
using namespace std;

void dfs(vector<int> &visited, vector<vector<int>> &mat, int cur) {
	visited[cur] = 1;
	for (int val : mat[cur]) {
		if (!visited[val]) {
			dfs(visited, mat, val);
		}
	}
}

int main() {
	int n;
	cin >> n;
	vector<vector<int>> mat(n+1);
	
	int u, v;
	for (int i = 0; i < n; i++) {
		cin >> u;
		while (cin >> v && v != 0) {
			mat[u].push_back(v);
		}
	}
	
	int k, start;
	cin >> k;
	
	while (k--) {
		cin >> start;
		vector<int> visited(n+1);
		
		dfs(visited, mat, start);
		vector<int> unreach;
		
		for (int i = 1; i <= n; i++) {
			if (!visited[i]) {
				unreach.push_back(i);
			}
		}
		
		if (unreach.empty()) cout << 0;
		else {
			for (int val : unreach) {
				cout << val << " ";
			}
		}
		cout << endl;
	}
}